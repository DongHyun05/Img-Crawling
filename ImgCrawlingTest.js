const GoogleImages = require("google-images");
let url = require("url");
let request = require("request");
const fs = require("fs");
var zip = new require("node-zip")();
const dotenv = require("dotenv");

dotenv.config();
// ** 8라인 본인의 검색엔진 ID와 API_KEY로 교체 필수
const client = new GoogleImages(process.env.ID, process.env.API_KEY);

// keyword values에 가져올 이미지의 단어를 입력
// 이미지 불러오는 과정에서 오류 생길시 API_KEY 새로 받아서 적용
const keyWord = "";
const pageStVal = 1;
const pageEndVal = 201;

let saveDir = __dirname + "/img" + "/" + keyWord;

if (!fs.existsSync(saveDir)) {
  fs.mkdirSync(saveDir);
}

// 이미지 검색
const searchFunc = (pageStVal) => {
  client
    .search(keyWord, { page: pageStVal, size: "large" })
    .then((images) => {
      images.forEach((img) => {
        console.log(img);
        let filePath = url.parse(img.url).pathname;
        let newFilePath = filePath.replace(/[^a-zA-Z0-8\.]+/g, "_");
        let localFilePath = saveDir + "/" + newFilePath;
        let pattern = /\.(jpg|png|gif)\b/;

        // 파일길이가 200 미만이고 이미지 파일인지 체크
        if (newFilePath.length < 200 && pattern.test(newFilePath)) {
          try {
            request
              .get(img.url)
              .on("error", function (err) {
                console.log("request error1:", err);
              })
              .pipe(
                fs.createWriteStream(localFilePath).on("close", function () {})
              );
          } catch (err) {
            console.log("request error2:", err);
          }
        }
      });
      compareTwoVal(pageStVal, pageEndVal);
    })
    .catch((error) => {
      console.log(">>>>>>>>>>>>>>>>>>>" + error);
      console.log("모든 이미지를 수집했습니다.");
      makeImgToZip();
      return;
    });
};

// 이미지 압축파일 만들기
const makeImgToZip = () => {
  var zipName = keyWord + ".zip";
  var someDir = fs.readdirSync(__dirname + "/img" + "/" + keyWord);
  var newZipFolder = zip.folder(keyWord);

  for (var i = 0; i < someDir.length; i++) {
    newZipFolder.file(
      someDir[i],
      fs.readFileSync(__dirname + "/img" + "/" + keyWord + "/" + someDir[i]),
      { base64: true }
    );
  }
  var data = zip.generate({ base64: false, compression: "DEFLATE" });
  fs.writeFile(
    __dirname + "/img" + "/" + zipName,
    data,
    "binary",
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
};

// 페이징 검색
const compareTwoVal = (pageStVal, pageEndVal) => {
  if (pageStVal <= pageEndVal) {
    setTimeout(function () {
      pageStVal += 10;
      console.log("pageStVal: >>>>>>>>" + pageStVal);
      searchFunc(pageStVal);
    }, 500);
  } else {
    console.log("모든 이미지를 수집했습니다.");
    makeImgToZip();
    return;
  }
};

// 이미지 수집 시작
searchFunc(pageStVal);
