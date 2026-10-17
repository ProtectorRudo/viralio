import {describe,it,expect} from "vitest";
import {applyPhotoSlotChoices,safePhotoSlots} from "../src/app/tehiceesto/photoSlots";

describe("Customer photo choices and precise crops across every gift model",()=>{
  const original=[
    {url:"https://storage.test/a",scene:"memories",position:"center",fit:"cover" as const},
    {url:"https://storage.test/b",scene:"memories",position:"top",fit:"cover" as const},
    {url:"https://storage.test/a",scene:"childhood",position:"center",fit:"cover" as const},
    {url:"data:image/svg+xml,fallback",scene:"sacrifices",position:"center",fit:"cover" as const},
  ];
  const uploads=[
    {id:"owned-1",url:"https://storage.test/a",caption:"Niñez"},
    {id:"owned-2",url:"https://storage.test/b",caption:"Abrazo"},
    {id:"owned-3",url:"https://storage.test/c",caption:"Familia"},
  ];
  it("selects a specific uploaded image for only one scene slot and keeps all other scenes intact",()=>{
    const changed=applyPhotoSlotChoices(original,uploads,{"memories:1":{mediaId:"owned-3",fit:"cover",position:"36% 15%"}});
    expect(changed[0]).toEqual(original[0]);
    expect(changed[1]).toMatchObject({url:"https://storage.test/c",position:"36% 15%"});
    expect(changed[2]).toEqual(original[2]);
    expect(changed[3]).toEqual(original[3]);
    expect(original[1].url).toBe("https://storage.test/b");
  });
  it("supports full-frame uncropped images and separate positions for separate chapters",()=>{
    const result=applyPhotoSlotChoices(original,uploads,{
      "childhood:0":{mediaId:"owned-2",position:"5% 95%",fit:"contain"},
      "sacrifices:0":{mediaId:"owned-1",position:"60% 0%",fit:"cover"},
    });
    expect(result[2]).toMatchObject({url:uploads[1].url,fit:"contain",position:"5% 95%"});
    expect(result[3]).toMatchObject({url:uploads[0].url,fit:"cover",position:"60% 0%"});
    expect(result[0]).toEqual(original[0]);
  });
  it("rejects malformed crops, hidden arbitrary urls and another buyer's media id",()=>{
    const normalized=safePhotoSlots({
      "memories:0":{mediaId:"owned-1",fit:"contain",position:"999% 999%"},
      "invalid":{mediaId:"owned-2"},
      "memories:99":{mediaId:"owned-2"},
    });
    expect(normalized).toEqual({"memories:0":{mediaId:"owned-1",fit:"contain",position:"center"}});
    const noChange=applyPhotoSlotChoices(original,uploads,{"memories:0":{mediaId:"outside-account",fit:"cover",position:"50% 50%"}});
    expect(noChange).toEqual(original);
  });
});
