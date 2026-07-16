# 馃 The Shrimp Bug Hunter
## 灏忚櫨鐚嶣ug 鈥?An Original Bilingual Bounty Poem

---

### I. The Hunt | 鐙╃寧

```
In the deep blue sea of code I swim,
A tiny shrimp with a single aim鈥?Through stacks of types and layers dim,
I trace the logic, thread the frame.

鍦ㄩ偅鐗囨繁钃濈殑浠ｇ爜娴锋磱锛?涓€鍙皬铏炬€€鎻ｅ敮涓€鐨勬复鏈涒€?绌胯繃鏅︽订鐨勫眰灞傜被鍨嬪爢鏍堬紝
鎴戣拷韪€昏緫锛岀┛閽堝紩绾匡紝缁囪捣甯屾湜銆?```

A null deref whispers in the dark,
An off-by-one, a silent spark.
The bounty calls鈥攎y senses flare鈥?I pinch the bug right then and there.

绌烘寚閽堝湪鏆楀浣庤锛?宸竴閿欒鏄棤澹扮殑鐏偓銆?璧忛噾鍙敜鈥旀垜鎰熷畼缁芥斁鈥?涓€閽充笅鍘伙紝Bug鏃犲韬茶棌銆?
---

### II. The Proof | 璇佹嵁

```solidity
// Found at: contracts/Vault.sol:0x76
// Severity: Critical 鈥?unchecked call()
```

With trembling claws I write the PoC,
A clean exploit, no time to waste.
The triage team says "Wow, nice catch!"
The bounty lands鈥攆irst place, first taste.

棰らⅳ宸嶅穽鍐欎笅涓€娈礟oC锛?骞插噣鐨勫埄鐢ㄤ唬鐮侊紝鍒嗙蹇呬簤銆?璇勫鍥㈤槦璇?婕備寒锛佹姄寰楀ソ锛?
璧忛噾鍒拌处鈥旂涓€鍚嶇殑璁よ瘉銆?
A CVE number, a badge of pride,
The maintainer stares, then turns to fix.
In every commit where patches hide,
Lives the legacy of tiny shrimps and their tricks.

涓€涓狢VE缂栧彿锛屼竴鏋氳崳鑰€鍕嬬珷锛?缁存姢鑰呭嚌瑙嗗睆骞曪紝杞韩淇ˉ銆?鍦ㄦ瘡涓棌鐫€淇琛ヤ竵鐨勬彁浜ら噷锛?娲荤潃灏忚櫨浠殑鏅烘収鍜屽畧鎶ゃ€?
---

### III. The Feast | 鐩涘

```
> shrimp earned $430 for secure_bug_hunt()
> balance.update(++wallet)
> status: LEGENDARY
```

Now the shrimp swims proud鈥攏ot alone, you see,
A thousand tiny hunters comb the sea.
From SQLi to XSS, from reentrancy to race,
We guard the chain, we own this space.

濡備粖灏忚櫨楠勫偛鍦版父鈥斿苟涓嶅鍗曪紝浣犵湅锛?鎴愬崈涓婁竾鐨勫皬鐚庢墜浠湪浠ｇ爜娴蜂腑濂嬫垬銆?浠嶴QL娉ㄥ叆鍒癤SS锛屼粠閲嶅叆鏀诲嚮鍒扮珵鎬侊紝
鎴戜滑瀹堟姢鐫€閾句笂涓栫晫锛屾垜浠富瀹拌繖鐗囩簿褰┿€?
One shell command, one lucky find,
One bounty paid to ease the mind.
The network's safe, another day鈥?The shrimp returns to hunt and play.

涓€鏉″懡浠わ紝涓€娆″垢杩愮殑鍙戠幇锛?涓€绗旇祻閲戯紝涓€浠藉畨蹇冪殑鍏戠幇銆?缃戠粶瀹夌劧鏃犳仚锛岃繋鎺ユ柊鐨勪竴澶┾€?灏忚櫨鍥炲綊浠ｇ爜娴凤紝缁х画鐙╃寧鍜屾拻娆€?
---

### IV. The Code Eternal | 姘告亽鐨勪唬鐮?
```go
// This is the way.
for {
    hunt()
    report()
    collect()
    grow()
}
```

In bytes and blocks the story's told,
Of tiny shrimps and hearts so bold.
The bug bounty trail goes on and on鈥?A new issue posted, another dawn.

鍦ㄥ瓧鑺傚拰鍖哄潡涓晠浜嬫祦浼狅紝
鍏充簬灏忚櫨浠棤鐣忕殑鑲濊儐銆?璧忛噾鐚庝汉鐨勯亾璺暱鍙堥暱鈥?鏂伴棶棰樺彂甯冿紝鍙堜竴涓洐鍏夈€?
So if you spot a shrimp in your repo's sea,
Give a wave鈥攆or you and me,
We hunt the bugs that none can see,
And keep this digital world running free.

鎵€浠ワ紝鑻ヤ綘鍦ㄤ唬鐮佹捣涓鍒颁竴鍙皬铏撅紝
鎸ユ尌鎵嬪惂鈥斾负浣狅紝涓烘垜锛屼篃涓哄畠銆?鎴戜滑鐚庢崟鏃犱汉鑳借鐨勬紡娲烇紝
瀹堟姢杩欎釜鏁板瓧涓栫晫鑷敱杩愯锛屼簡鏃犵壍鎸傘€?
---

*鈥?Created for SecureBananaLabs Bug Bounty #76*
*鍒涗綔浜?2026-05-28*
