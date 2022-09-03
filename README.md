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
## 尤其是await this.executor.UpdateSnapshot(last.time, last.close);这个影响很大
## 需要思考回测是否应该禁用异步，另外也需要优化各种条件判断结构（是否需要区分成为独立的代码，以减少判断）

## 先投入优化器开发

## 考夫曼均线， T07，SRSI

## 优化器先放一下，目前全局随机

## TODO LIST
  T07 金叉时间范围
  T07 ATR止损 视频学习
  SRSI 指标实现
  随机优化器代码review
  fast >= slow bug排查

## IDict的泛型问题
