const spider = require('./model/spider');
const file = require('./model/file');

// 城市列表: [长沙，深圳，上海]
const citys = [
  {code: 749, name: 'changSha'},
  {code: 765, name: 'shenzheng'},
  {code: 538, name: 'shanghai'},
]; 

let start = 0, // 爬取的url之start值
  index = 0, // 爬取的citys开始值
 cityJson = {data: []},// 待存入数据
 job = '前端开发工程师', // 爬取的职位
 date = new Date().toLocaleDateString(); // 爬取的时间

// 筛选数据
function format(results) {
  const arr = [];
  results.map(item => {
    // item.salary是'10K-15K'的格式
    let salarys = item.salary.split('-');
    // 正则筛选数据
    const regexRemove = /达内|培训|学徒|实习|助理|实训|设计|ui|php|python|ue4|unity|u3d|c#|后端|游戏|专员|基础|产品经理|mcu|ic|gis|ios|andriod|帐|催|转行/i;
    const regexInclude = /前端|web|h5|html5|script|js|vue|react|node|小程序|公众号|微信/i;
    if(regexInclude.test(item.jobName)&&!regexRemove.test(item.jobName)){
      // 选取指定字段
      arr.push([
        item.company.name,
        item.company.size.name,
        item.company.url,
        item.positionURL,
        item.workingExp.name,
        parseFloat(salarys[0]),
        parseFloat(salarys[1]),
        item.jobName,
        item.geo.lat,
        item.geo.lon,
        item.city.items[0].name,
        item.city.items[1] ? item.city.items[1].name : '',
        item.updateDate
      ])
    }
  });
  return arr
}

async function run() {
  let data, json, arr, dbResult;
  try {
    // 爬取数据
    data = await spider.fetch(start, citys[index].code);
    json = JSON.parse(data);

    // 格式化数据
    arr = format(json.data.results);

    // 写入数据库
    // dbResult = await db.insert(arr, tableName);

    // 数据写入
    cityJson.data.splice(cityJson.data.length, 0, ...arr); //将传来的对象push进数组对象中

  } catch (e) {
    // 如果出现错误，将错误写入文件
    console.error(e);
    await file.writeFile('error.txt', e.stack);
    let log = json.data.results;
    await file.writeFile('error.json', JSON.stringify(log));
    return;
  }
  // 成功后start自增100
  start += 100;
  // 控制台输出成功信息
  console.log(arr);
  // 输出start值，用于记录。如果出错则可根据此修改初始start值
  console.log(start);

  if (start <= json.data.numFound) {
    // 设置一点间隔时间, 避免被智联判断成DDOS攻击（可能会封IP）
    setTimeout(run, 600);
  } else {
    // 将数据存入文件
    cityJson.total = cityJson.data.length; //定义一下总条数，为以后的分页打基础
    cityJson.city = citys[index].name; //城市名
    cityJson.job = job; // 爬取的职业
    cityJson.date = date; // 爬取的时间
    file.writeFile(`./data/${citys[index].name}-data.json`, JSON.stringify(cityJson)).then((err) => {
      if (err) throw err;
      // 爬取完毕
      console.log('总数：'+cityJson.total);
      console.log(citys[index].name + ' crawling done!');
      index++;start = 0;
      setTimeout(run, 600);
      if(index >= citys.length){
        console.log('completed!');
        process.exit();
      } 
    });
  }
}

run().catch(e => {
  console.error(e);
});
