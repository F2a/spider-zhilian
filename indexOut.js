// 这个文件的方法已经废弃

const spider = require('./model/spider');
const file = require('./model/file');

let start = 0, // 爬取的url之start值
 status = 'fulfilled';  // 判断是否在文件是否在写入中

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
      // 选取制定字段
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
  let data, json, dbResult;
  if(status === 'pending'){ // 文件在写入状态时，退出程序
    return
  }
  try {
    // 爬取数据
    data = await spider.fetch(start);
    json = JSON.parse(data);

    // 格式化数据
    let arr = format(json.data.results);

    // 写入数据库
    // dbResult = await db.insert(arr, tableName);

    // 获取文件数据
    file.readFile('./data/data.json').then((filedata) => {
      status = 'pending'; // 文件状态-->写入中
      let jobs = filedata.toString();// 将二进制的数据转换为字符串
      jobs = JSON.parse(jobs);//将字符串转换为json对象
      if(start === 0){ // 重置文件数据
        jobs.data = [];
      }
      jobs.data.splice(jobs.data.length, 0, ...arr);//将传来的对象push进数组对象中
      console.log(jobs);
      jobs.total = jobs.data.length;//定义一下总条数，为以后的分页打基础
      return JSON.stringify(jobs);
    }).then((JSONjobs) => {
      // 写入文件
      file.writeFile('./data/data.json', JSONjobs).then((err) => {
        if (err) throw err;
        status = 'fulfilled'; // 文件状态-->写入完成
      });
    })
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
  console.log(dbResult);
  // 输出start值，用于记录。如果出错则可根据此修改初始start值
  console.log(start);

  if (start <= json.data.numFound) {
    // 作为一枚有底线的爬虫，当然要设置一点间隔时间
    setTimeout(run, 500);
  } else {
    // 爬取完毕
    console.log('done!');
    process.exit();
  }
}

run().catch(e => {
  console.error(e);
});
