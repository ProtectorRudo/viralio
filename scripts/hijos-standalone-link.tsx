import React from "react";
export default function Link({href,children,...props}:{href:string|{pathname:string};children:React.ReactNode;[key:string]:unknown}){
  const dest=typeof href==="string"?href:href.pathname;
  return <a href={dest} {...props}>{children}</a>;
}
