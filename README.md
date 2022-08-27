# 使用
## 配置BinanceAPI的.secret.json文件
```
{
  "API_KEY": "xxx",
  "SECRET_KEY": "xxx"
}
```
## 配置钉钉机器人的.dingtalk.json文件
```
{
  "ACCESS_TOKEN": "xxx",
  "SECRET": "yyy",
  "AT_MOBILES": ["153xxxx"]
}
```
## 进入dist/app目录 创建output文件夹 运行 ./ma_crosser.js
```
./ma_crosser.js --symbol BTC/USDT --timeframe 2h --funds 1000
```
更多命参数可查看代码

## mini_recorder可用，在app/dist目录中 参数为 symbol 轮训时间间隔


## BackTestingBasic 中每一个await都会产生很大性能开销，之后需要优化
