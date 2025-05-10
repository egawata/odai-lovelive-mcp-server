# ラブライブ！ イラストお題メーカー MCP Server

## 概要

ラブライブ！シリーズのキャラクターが登場するイラストのお題を作成する MCP Server です。

Claude Desktop 等の MCP Client を使って、お題を作成することができます。

現在、以下のグループに対応しています。

- μ’ｓ
- Aqours
- 虹ヶ咲
- Liella!
- 蓮ノ空

## サンプル

例：Claude Desktop から以下のメッセージを送信

~~~
Liella と 蓮ノ空のメンバー3人でお題を作ってください
~~~

MCP Server への Request

~~~json
{
  "num": 3,
  "seriesIDs": ["4","5"]
}
~~~

MCP Server からの Response

~~~json
{"characters":[{
    "name":"澁谷かのん",
    "link":"https://lovelive-sif2.bushimo.jp/member/liella/kanon/"
},{
    "name":"百生吟子",
    "link":"https://www.lovelive-anime.jp/hasunosora/member/07/"
},{
    "name":"鬼塚夏美",
    "link":"https://lovelive-sif2.bushimo.jp/member/liella/natsumi/"
}],
"place":"牧場",
"time":"夜",
"action":"観光",
"item":"リボン"}
~~~

## 動作環境

以下の環境で動作確認しています。

- macOS Sequoia 15.4 (Windows, Linux 等でも多分動きます)
- node v22.11.0
- Claude for Mac 0.9.3

## 使い方

### ビルド

~~~sh
npm ci
npm run build
~~~

### MCP Client の設定

`/PATH/TO` の部分は、このプロジェクトを配置したディレイクトリ名に変更してください。

~~~json
{
  "mcpServers": {
    "odai-lovelive": {
      "command": "node",
      "args": [
        "/PATH/TO/odai-lovelive-mcp-server/build/index.js",
        "/PATH/TO/odai-lovelive-mcp-server/data.json"
      ]
    }
  }
}
~~~

### MCP Client からメッセージを送る

- `人数`
    - 1人 - 10人
    - 省略時は1人
- `グループ`
    - 複数指定可能
    - 省略時は全グループが対象 

~~~
Liella と 蓮ノ空のメンバー3人でお題を作ってください
~~~

## データのカスタマイズ

構成ファイル(json)の引数で渡しているデータファイル `data.json` を編集して内容のカスタマイズが可能です。
「サニパ様がいないのはけしからん」「Saint Snowどこ」等のご不満がある方は編集してみてください。
(`src/index.ts` の説明文に手を加える必要があるかもしれません)

## 補足

- 本ツールは「ラブライブ！」運営様とは全く関係なく、私個人のファン活動の一部として制作されたものです。
- 使用しているデータのうち、「ラブライブ！」シリーズに関わるものの権利は各作品の権利者様にあります。
- https://www.lovelive-anime.jp/
