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
- イキヅライブ

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

### 動作モード

本 MCP Server は2つの動作モードをサポートしています:

1. **stdio モード** (デフォルト): Claude Desktop などのローカル MCP クライアント用
2. **HTTP モード**: リモートサーバで公開する場合

### stdio モード (ローカル利用)

#### MCP Client の設定

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

### HTTP モード (リモートサーバ公開)

外部サーバで公開して、不特定多数のユーザーが利用できるようにする場合の設定です。

#### 1. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、必要に応じて編集します:

~~~sh
cp .env.example .env
~~~

`.env` ファイルの例:

~~~sh
MCP_MODE=http
PORT=3000
HOST=localhost
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
~~~

#### 2. サーバの起動

~~~sh
# 環境変数を読み込んで起動
export $(cat .env | xargs)
node build/index.js /path/to/data.json
~~~

または、直接環境変数を指定:

~~~sh
MCP_MODE=http PORT=3000 node build/index.js ./data.json
~~~

#### 3. エンドポイント

- **SSE エンドポイント**: `http://localhost:3000/sse`
- **ヘルスチェック**: `http://localhost:3000/health`

#### 4. nginx でリバースプロキシ設定 (推奨)

HTTPS 接続は nginx などのリバースプロキシで対応することを推奨します。

`/etc/nginx/sites-available/mcp-server` の設定例:

~~~nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 証明書 (Let's Encrypt など)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # セキュリティヘッダー
    add_header Strict-Transport-Security "max-age=31536000" always;

    # ヘルスチェック
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
    }

    # SSE エンドポイント
    location /sse {
        proxy_pass http://localhost:3000/sse;
        proxy_http_version 1.1;

        # SSE に必要な設定
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_buffering off;

        # タイムアウト設定
        proxy_read_timeout 86400;

        # ヘッダーの転送
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # メッセージ送信エンドポイント
    location /message {
        proxy_pass http://localhost:3000/message;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP から HTTPS へリダイレクト
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
~~~

#### 5. MCP Client の設定 (HTTP モード)

Claude Desktop などの設定:

~~~json
{
  "mcpServers": {
    "odai-lovelive": {
      "url": "https://your-domain.com/sse"
    }
  }
}
~~~

## データのカスタマイズ

構成ファイル(json)の引数で渡しているデータファイル `data.json` を編集して内容のカスタマイズが可能です。
「サニパ様がいないのはけしからん」「Saint Snowどこ」等のご不満がある方は編集してみてください。
(`src/index.ts` の説明文に手を加える必要があるかもしれません)

## 補足

- 本ツールは「ラブライブ！」運営様とは全く関係なく、私個人のファン活動の一部として制作されたものです。
- 使用しているデータのうち、「ラブライブ！」シリーズに関わるものの権利は各作品の権利者様にあります。
- https://www.lovelive-anime.jp/
