"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = __importDefault(require("pg"));
var axios_1 = __importDefault(require("axios"));
var twitter_api_v2_1 = require("twitter-api-v2");
var dotenv_1 = __importDefault(require("dotenv"));
var scraper_1 = require("./scraper");
dotenv_1.default.config({ path: '.env' });
var getEnvOrCrash = function (envVarName) {
    var val = process.env[envVarName];
    if (typeof val === 'string')
        return val;
    throw new Error('MISSING ENV VAR: ' + envVarName);
};
var post_on_twitter = function () { return __awaiter(void 0, void 0, void 0, function () {
    var twitterApiForDyingStoic, connectionString, db_client, db_obituary_response, db_tweet_response, last_tweet_time, now, diff_ms, diff_hours, obituary_to_tweet, tweet_pic, first_name, standard_message, tweet_text, axios_response, pic_upload_stream, pic_type, photoID, uploadedTweet, tweet_url, tweet_time, insert_query;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                twitterApiForDyingStoic = new twitter_api_v2_1.TwitterApi({
                    appKey: getEnvOrCrash('TWITTER_APP_KEY'),
                    appSecret: getEnvOrCrash('TWITTER_APP_SECRET'),
                    accessToken: getEnvOrCrash('TWITTER_ACCESS_TOKEN'),
                    accessSecret: getEnvOrCrash('TWITTER_ACCESS_SECRET'),
                });
                connectionString = getEnvOrCrash('DB_KEY');
                db_client = new pg_1.default.Client({
                    connectionString: connectionString,
                    ssl: {
                        rejectUnauthorized: false,
                    },
                });
                return [4 /*yield*/, db_client.connect()];
            case 1:
                _a.sent();
                return [4 /*yield*/, db_client.query('SELECT * from obituaries WHERE is_twitted is FALSE ORDER BY id DESC LIMIT 1')];
            case 2:
                db_obituary_response = _a.sent();
                return [4 /*yield*/, db_client.query('SELECT * from tweets ORDER BY tweet_time DESC LIMIT 1')
                    // -----------Casting and filtering-----------
                    // Don't post if last tweet was within 24h
                ];
            case 3:
                db_tweet_response = _a.sent();
                // -----------Casting and filtering-----------
                // Don't post if last tweet was within 24h
                if (db_tweet_response.rows.length > 0) {
                    last_tweet_time = db_tweet_response.rows[0].tweet_time;
                    now = new Date();
                    diff_ms = now.getTime() - last_tweet_time.getTime();
                    diff_hours = Math.floor(diff_ms / 3600000);
                    if (diff_hours < 24) {
                        console.log('Last tweet was within 24h, not posting again');
                        return [2 /*return*/];
                    }
                    console.log(last_tweet_time);
                    console.log(now);
                    console.log(diff_ms);
                    console.log('diff in hours ', diff_hours);
                }
                if (db_obituary_response.rows.length === 0) {
                    console.log('No obituary to post');
                    return [2 /*return*/];
                }
                obituary_to_tweet = db_obituary_response.rows[0];
                tweet_pic = obituary_to_tweet.picture_url;
                first_name = obituary_to_tweet.name.replace(/ .*/, '');
                standard_message = ' left us. \r\n\r\nRemember you will die too.';
                tweet_text = first_name.concat(standard_message);
                console.log('first name  ', first_name);
                console.log('twitter text  ', tweet_text);
                return [4 /*yield*/, axios_1.default.get(tweet_pic, {
                        responseType: 'arraybuffer',
                    })];
            case 4:
                axios_response = _a.sent();
                pic_upload_stream = axios_response.data;
                pic_type = axios_response.headers['content-type'];
                console.log('got back image from picture_url', pic_type, pic_upload_stream.length);
                return [4 /*yield*/, twitterApiForDyingStoic.v1.uploadMedia(pic_upload_stream, {
                        mimeType: pic_type,
                    })];
            case 5:
                photoID = _a.sent();
                console.log('uploaded image to twitter', photoID);
                return [4 /*yield*/, twitterApiForDyingStoic.v2.tweet(tweet_text, { media: { media_ids: [photoID] } })];
            case 6:
                uploadedTweet = _a.sent();
                console.log('uploaded tweet successfuly', uploadedTweet.data, uploadedTweet.errors);
                tweet_url = uploadedTweet.data.text;
                tweet_time = new Date().toISOString();
                // Mark row as processed/twitted
                return [4 /*yield*/, db_client.query("UPDATE obituaries SET is_twitted = TRUE WHERE id = ".concat(obituary_to_tweet.id))
                    // Log tweet in db
                    // TODO escape if Twitter API shows tweet not successfully posted
                ];
            case 7:
                // Mark row as processed/twitted
                _a.sent();
                insert_query = "INSERT INTO tweets(tweet_text, tweet_time, tweet_url) VALUES ('".concat(tweet_text, "','").concat(tweet_time, "','").concat(tweet_url, "');");
                console.log(insert_query);
                return [4 /*yield*/, db_client.query(insert_query)];
            case 8:
                _a.sent();
                return [4 /*yield*/, db_client.end()];
            case 9:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var scraped_results, posted_results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraped_results = (0, scraper_1.scraper)();
                    posted_results = post_on_twitter();
                    return [4 /*yield*/, Promise.all([scraped_results, posted_results])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
console.log('running DyingStoic');
main()
    .then(function () {
    console.log('DyingStoic successfully ran');
    process.exit(0);
})
    .catch(function (error) {
    console.error('DyingStoic failed', error);
    process.exit(1);
});
