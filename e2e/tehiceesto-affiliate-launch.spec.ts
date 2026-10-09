import {expect,test} from "playwright/test";

const API="**/functions/v1/affiliate-public";
const TOKEN="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO123456789";

test.describe("TeHiceEsto: affiliate shortlink launch gate",()=>{
  test("shortlink attributes the visitor before redirecting home",async({page})=>{
    let trackRequests=0;
    await page.route(API,async route=>{
      const body=route.request().postDataJSON();
      if(body.action!=="track")return route.abort();
      trackRequests++;
      expect(body.code).toBe("ailin");
      expect(body.source).toBe("short");
      await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
        ok:true,affiliateSlug:"ailin",affiliateToken:TOKEN,
        expiresAt:new Date(Date.now()+30*86400e3).toISOString(),
      })});
    });
    await page.goto("/tehiceesto/a");
    await expect(page).toHaveURL(/\/tehiceesto\/?$/, {timeout:15000});
    expect(trackRequests).toBe(1);
    const cookies=await page.context().cookies();
    expect(cookies.find(x=>x.name==="thi_affiliate_token")?.value).toBe(TOKEN);
    expect(cookies.find(x=>x.name==="thi_affiliate_code")?.value).toBe("ailin");
    expect(cookies.find(x=>x.name==="thi_affiliate_token")?.expires||0).toBeGreaterThan(Date.now()/1000+20*86400);
  });
  test("failed tracking does not silently lose Ailin's commission and can retry",async({page})=>{
    let available=false;
    let failedRequests=0;
    await page.route(API,async route=>{
      const body=route.request().postDataJSON();
      if(body.action!=="track")return route.abort();
      if(!available){failedRequests++;return route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"temporarily_unavailable"})});}
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
        ok:true,affiliateSlug:"ailin",affiliateToken:TOKEN,
        expiresAt:new Date(Date.now()+30*86400e3).toISOString(),
      })});
    });
    await page.goto("/tehiceesto/a");
    await expect(page.getByRole("button",{name:/Volver a intentar/i})).toBeVisible({timeout:15000});
    await expect(page).toHaveURL(/\/tehiceesto\/a$/);
    expect((await page.context().cookies()).some(c=>c.name==="thi_affiliate_token")).toBe(false);
    expect(failedRequests).toBeGreaterThan(0);
    available=true;
    await page.getByRole("button",{name:/Volver a intentar/i}).click();
    await expect(page).toHaveURL(/\/tehiceesto\/?$/, {timeout:15000});
    expect((await page.context().cookies()).find(c=>c.name==="thi_affiliate_token")?.value).toBe(TOKEN);
  });
});
