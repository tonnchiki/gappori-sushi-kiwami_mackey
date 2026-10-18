# がっぽり寿司極 期待値計算機

現在のバージョン：**1.1.0**

公開URL：https://tonnchiki.github.io/gappori-sushi-kiwami_mackey/

## 使い方

1. 配置番号（1〜29）を指定。「次の配置へ」で順番に切り替えます（29→1）。
2. 実機に合わせて、異なるネタ同士の境目に☆を配置します。末尾と先頭Aの境目にも配置できます。
3. A・B・C…の各ネタについて、購入数を合計5個にします。同じ穴数のネタも別々に指定します。
4. フリー率と配当を入力し「期待値を計算する」を押します。

SPの初期種類は配置表に従います。☆の初期位置は末尾とAの間なので、実機の位置に変更してください。

## ファイル

- `index.html`：画面
- `styles.css`：スマートフォン対応のスタイル
- `layouts.js`：29配置と18穴の組み立て
- `calculator.js`：計算処理（Web Worker）
- `app.js`：入力・配置・結果表示

最初の5球、入賞済みの穴から次の空き穴への移動、3球後の最適フリー、おかみSPの追加球、どっちかSPの50:50は1.0.0のモデルを引き継ぎます。5球の計算は重み付き全列挙です。累計黒字の確率のみ5,000回超では正規近似を使います。

## バージョンの保存と復元

- [`1.0.0`](https://github.com/tonnchiki/gappori-sushi-kiwami_mackey/releases/tag/1.0.0)：変更前の単一HTML版
- [`1.1.0`](https://github.com/tonnchiki/gappori-sushi-kiwami_mackey/releases/tag/1.1.0)：配置選択・SP指定版

各リリースの「Source code (zip)」で、その版のファイルを取得できます。タグは公開サイトのURLを切り替えません。サイトを旧版に戻すには、タグの内容をmainへ復元してコミットし、GitHub Pagesの公開完了を待ちます。
