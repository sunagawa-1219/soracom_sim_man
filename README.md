# SORACOM SIM 自動管理アプリ

## 概要

SORACOM SIM を自動管理できる kintone アプリのための lambda コードです。

アプリの構成などについては [Qiita 記事](https://qiita.com/naoko_s/items/877ba987c29555d7c32b)を御覧ください。

## 開発環境

- Node.js8.10

## 環境変数について

セキュリティのため、以下の情報は環境変数に持たせています。

- KINTONE_TOKEN : kintone api を使用するのに必要なトークン
- USER_NAME : kintone の basic 認証に必要なユーザー名
- PASSWORD : kintone の basic 認証に必要なパスワード
- SUB_DOMAIN : kintone のサブドメイン
- APP_ID : 対象の kintone のアプリ ID
- SORACOM_AUTH_KEY : SORACOM API を使用するために使う SORACOM ユーザーの認証キー ID
- SORACOM_SECRET_KEY : SORACOM ユーザーのシークレットキー
