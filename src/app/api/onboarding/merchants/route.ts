import { NextResponse } from "next/server";
import { viralio } from "@/application";
import { merchantExperiencePath } from "@/config/merchant-accounts";
import { isSameOrigin, verifyOnboardingKey } from "@/security/merchant-auth";

interface OnboardingPrizeInput {
  name: string;
  probability: number;
}

function parseRewardValidityDays(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 90) {
    throw new Error("Invalid rewardValidityDays");
  }
  return value;
}

function parsePrizes(value: unknown): OnboardingPrizeInput[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length !== 5) throw new Error("Invalid prizes");

  const prizes = value.map((candidate): OnboardingPrizeInput => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Invalid prizes");
    const record = candidate as Record<string, unknown>;
    if (typeof record.name !== "string") throw new Error("Invalid prize name");
    const name = record.name.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 90 || /[<>]/.test(name)) throw new Error("Invalid prize name");
    if (
      typeof record.probability !== "number" ||
      !Number.isInteger(record.probability) ||
      record.probability < 0 ||
      record.probability > 100
    ) {
      throw new Error("Invalid prize probability");
    }
    return { name, probability: record.probability };
  });

  if (prizes.reduce((sum, prize) => sum + prize.probability, 0) !== 100) {
    throw new Error("Prize probabilities must total 100");
  }
  return prizes;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.onboardingKey !== "string" || !verifyOnboardingKey(body.onboardingKey)) {
      return NextResponse.json({ error: "Clave de alta inválida" }, { status: 401 });
    }

    const prizes = parsePrizes(body.prizes);
    const rewardValidityDays = parseRewardValidityDays(body.rewardValidityDays);
    const {
      onboardingKey: _onboardingKey,
      prizes: _prizes,
      rewardValidityDays: _rewardValidityDays,
      ...merchantInput
    } = body;
    void _onboardingKey;
    void _prizes;
    void _rewardValidityDays;

    let merchant = await viralio.createMerchant(merchantInput);

    if (prizes || rewardValidityDays !== undefined) {
      const customization = await viralio.getMerchantCustomization(merchant.id);
      merchant = await viralio.updateMerchantCustomization(merchant.id, {
        ...customization,
        prizes: prizes
          ? customization.prizes.map((prize, index) => ({
              ...prize,
              name: prizes[index]!.name,
              probability: prizes[index]!.probability,
            }))
          : customization.prizes,
        rewardValidityDays: rewardValidityDays ?? customization.rewardValidityDays,
      });
    }

    return NextResponse.json({
      merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name },
      experiencePath: merchantExperiencePath(merchant.slug),
      qrPath: `/q/${merchant.slug}`,
      panelPath: `/comercio/${merchant.slug}/canjes`,
    }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("already exists")) {
      return NextResponse.json({ error: "Ese identificador ya está en uso" }, { status: 409 });
    }
    return NextResponse.json({ error: "Datos de alta inválidos" }, { status: 400 });
  }
}
