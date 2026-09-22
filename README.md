# Elin 魔法出力計算

EA 23.347 の提供ソースシートを用いた非公式計算サイト。

`dist/` を GitHub Pages に配信します。設定の Pages → Source は GitHub Actions を選択します。

ローカル起動: `node serve.cjs`。検証: `node test.cjs`。

魔法・アビリティの日本語名、英語名、ID、alias で検索できます。主能力・レベルは補正後の値を入力します。対応可否は提供されたクラスと継承関係から確認し、未確認の種類は明示します。ゲーム内での実測照合は未実施です。

連続魔法の判定は Chara.UseAbility の CanRapidFire とフィート1648の確認に基づきます。参照コミット: f9a4e87b55685a570391d7438ce25473923a7343 (Elin-Modding-Resources/Elin-Decompiled)。

公開対象はサイトと抽出データです。逆コンパイルされた C# ファイル自体は含めません。

