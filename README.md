# spider-zhilian

### 目的

使用Node爬取招聘信息，以便制作薪资统计图和地域分布图

### 文件布局
```
|-- data                             // 数据存储位置
|-- model                            // 工具模块
|   |-- file.js                      // 文件存写模块
|   |-- spider.js                    // 爬虫模块
|-- index.js                         // 主程序
|-- indexOut.js                      // 主程序（被废弃的方法）
|-- package.json                     // Node 配置
```

### 使用

``` bash
# 安装
npm install

# 执行程序
node index

# 爬取结果存入 ./data/data.json 中

```