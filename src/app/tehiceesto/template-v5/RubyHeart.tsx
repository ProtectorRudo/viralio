"use client";

export default function RubyHeart() {
  return (
    <svg className="thi-ruby-art" viewBox="0 0 460 445" role="presentation" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ruby-shell" x1="7%" y1="8%" x2="91%" y2="89%">
          <stop offset="0" stopColor="#ffcecf"/>
          <stop offset=".10" stopColor="#b81235"/>
          <stop offset=".26" stopColor="#550016"/>
          <stop offset=".42" stopColor="#e5123b"/>
          <stop offset=".63" stopColor="#3a0012"/>
          <stop offset=".85" stopColor="#fd2e50"/>
          <stop offset="1" stopColor="#5a0018"/>
        </linearGradient>
        <radialGradient id="ruby-core" cx="50%" cy="64%" r="55%">
          <stop offset="0" stopColor="#fff1d0" stopOpacity=".96"/>
          <stop offset=".12" stopColor="#ff6d65" stopOpacity=".84"/>
          <stop offset=".37" stopColor="#e10b38" stopOpacity=".35"/>
          <stop offset="1" stopColor="#b3002b" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="ruby-glass" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff8eb" stopOpacity=".84"/>
          <stop offset=".19" stopColor="#ff8098" stopOpacity=".13"/>
          <stop offset=".53" stopColor="#4b061d" stopOpacity="0"/>
          <stop offset=".86" stopColor="#ffd7d1" stopOpacity=".65"/>
          <stop offset="1" stopColor="#d20036" stopOpacity=".22"/>
        </linearGradient>
        <linearGradient id="ruby-centerline" x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#fff8db" stopOpacity=".9"/>
          <stop offset=".44" stopColor="#f04164" stopOpacity=".28"/>
          <stop offset=".84" stopColor="#ffeccc" stopOpacity=".72"/>
          <stop offset="1" stopColor="#ffb39c" stopOpacity=".25"/>
        </linearGradient>
        <filter id="ruby-bloom" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="22"/>
        </filter>
        <filter id="ruby-streak" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5"/>
        </filter>
        <clipPath id="ruby-cut"><path d="M230 410 C162 359 34 251 37 145 C40 65 135 19 230 100 C324 18 421 65 423 145 C426 253 299 358 230 410 Z"/></clipPath>
      </defs>
      <path d="M230 410 C162 359 34 251 37 145 C40 65 135 19 230 100 C324 18 421 65 423 145 C426 253 299 358 230 410 Z" fill="#ff355c" opacity=".34" filter="url(#ruby-bloom)"/>
      <path d="M230 410 C162 359 34 251 37 145 C40 65 135 19 230 100 C324 18 421 65 423 145 C426 253 299 358 230 410 Z" fill="url(#ruby-shell)" stroke="#ff9ba0" strokeOpacity=".87" strokeWidth="3"/>
      <g clipPath="url(#ruby-cut)">
        <path d="M30 98L142 50 125 150 38 191Z" fill="#ffb8b4" opacity=".39"/>
        <path d="M142 50L230 100 175 192 125 150Z" fill="#78001d" opacity=".82"/>
        <path d="M142 50L175 192 103 218 125 150Z" fill="#ec1c48" opacity=".57"/>
        <path d="M38 191L125 150 103 218 104 296Z" fill="#32000f" opacity=".7"/>
        <path d="M103 218L175 192 230 290 104 296Z" fill="#c40932" opacity=".62"/>
        <path d="M104 296L230 290 230 410Z" fill="#470014" opacity=".69"/>
        <path d="M230 100L318 54 346 151 282 189Z" fill="#fb5572" opacity=".42"/>
        <path d="M318 54L426 113 347 151Z" fill="#ffe0d3" opacity=".62"/>
        <path d="M426 113L347 151 352 229 430 200Z" fill="#80001e" opacity=".7"/>
        <path d="M347 151L282 189 352 229Z" fill="#33000e" opacity=".81"/>
        <path d="M282 189L230 100 175 192 230 290Z" fill="#440016" opacity=".81"/>
        <path d="M282 189L352 229 230 290Z" fill="#fc244e" opacity=".48"/>
        <path d="M352 229L428 200 349 316 230 290Z" fill="#62001b" opacity=".71"/>
        <path d="M349 316L230 410 230 290Z" fill="#f41b44" opacity=".45"/>
        <path d="M175 192L230 100 230 290Z" fill="#fa2d54" opacity=".15"/>
        <path d="M230 290L282 189 230 410Z" fill="#ff2353" opacity=".25"/>
        <path d="M75 128L137 88 123 158Z" fill="#fff1de" opacity=".25"/>
        <path d="M323 76L375 102 347 151Z" fill="#fff5e9" opacity=".7"/>
        <path d="M284 116L345 153 285 186Z" fill="#ffb8ba" opacity=".34"/>
        <path d="M131 151L176 192 123 213Z" fill="#ffa7b5" opacity=".36"/>
        <path d="M158 241L230 290 167 321Z" fill="#ff9ca2" opacity=".27"/>
        <path d="M265 307L348 258 319 343Z" fill="#ff8991" opacity=".4"/>
        <path d="M225 107L230 290 235 107Z" fill="#ffc4c4" opacity=".5"/>
        <path d="M25 83L140 51 79 131Z" fill="#f7d0c4" opacity=".65"/>
        <path d="M381 83L433 145 344 161Z" fill="#ff87a0" opacity=".36"/>
        <path d="M30 80L230 100 420 80" fill="none" stroke="#fff4e8" strokeOpacity=".17" strokeWidth="3"/>
        <path d="M230 100L230 410M123 151L230 290 347 151M103 218L230 290 352 229M103 218L230 410 352 229" fill="none" stroke="#ffd8d2" strokeOpacity=".27" strokeWidth="1.5"/>
        <ellipse cx="230" cy="277" rx="135" ry="145" fill="url(#ruby-core)" className="thi-ruby-ember"/>
        <path d="M64 111 C107 45 169 48 211 91" stroke="url(#ruby-glass)" strokeWidth="13" strokeLinecap="round" opacity=".5" fill="none" filter="url(#ruby-streak)"/>
        <path d="M402 128 C400 201 355 295 258 386" stroke="#ffe2d0" strokeWidth="8" strokeLinecap="round" opacity=".41" fill="none" filter="url(#ruby-streak)"/>
        <path d="M230 104L230 403" stroke="url(#ruby-centerline)" strokeWidth="3" opacity=".65"/>
        <path d="M74 107 C109 58 166 57 207 102" fill="none" stroke="#fff7e8" strokeWidth="3.8" strokeLinecap="round" opacity=".85"/>
        <path d="M258 99 C313 50 377 73 399 126" fill="none" stroke="#ffcfcd" strokeWidth="3" strokeLinecap="round" opacity=".56"/>
      </g>
      <path d="M230 410 C162 359 34 251 37 145 C40 65 135 19 230 100 C324 18 421 65 423 145 C426 253 299 358 230 410 Z" fill="none" stroke="url(#ruby-glass)" strokeWidth="6"/>
      <g fill="#fff8ef">
        <path d="M230 236l6 18 18 6-18 5-6 19-6-19-19-5 19-6Z" className="thi-ruby-spark" opacity=".76"/>
        <circle cx="364" cy="127" r="2.8" opacity=".95"/>
        <circle cx="100" cy="114" r="2.2" opacity=".7"/>
        <circle cx="284" cy="349" r="1.7" opacity=".75"/>
      </g>
    </svg>
  );
}
