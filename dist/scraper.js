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
exports.scraper = void 0;
var pg_1 = __importDefault(require("pg"));
var axios_1 = __importDefault(require("axios"));
var cheerio_1 = require("cheerio");
/*
Scrap website
Add to DB
Make it once a day (same cron job as index.ts, behind 24h behind is fine)
*/
function scraper() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var connectionString, db_client, obituaries_already_in_db, baseURL, url, data, html, $, deads, _i, _c, i, $container, $img, $name, $years, picture_url_lowres, picture_url, years, date_birth, date_death, name_1, _loop_1, _d, deads_1, dead;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    connectionString = 'postgres://mementomori_user:FWPBp6YBAUE1kZ6AyxRwXmScLcHlwH8k@dpg-cbj5hus41ls599pueh4g-a.ohio-postgres.render.com/mementomori';
                    db_client = new pg_1.default.Client({
                        connectionString: connectionString,
                        ssl: {
                            rejectUnauthorized: false,
                        },
                    });
                    return [4 /*yield*/, db_client.connect()];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, db_client.query('SELECT * from obituaries ORDER BY id DESC LIMIT 10')
                        // -----------Scrap-----------
                    ];
                case 2:
                    obituaries_already_in_db = _e.sent();
                    baseURL = 'https://www.forevermissed.com';
                    url = "".concat(baseURL, "/findmemorial/");
                    return [4 /*yield*/, axios_1.default.get(url, {
                            responseType: 'text',
                        })];
                case 3:
                    data = _e.sent();
                    html = data.data;
                    $ = (0, cheerio_1.load)(html);
                    deads = [];
                    for (_i = 0, _c = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; _i < _c.length; _i++) {
                        i = _c[_i];
                        $container = "#gallery-search > div.content.search-results > ul > li:nth-child(".concat(i, ") ");
                        $img = $("".concat($container, " > a > img"));
                        $name = $("".concat($container, " > div > div.memorial-title > a > span:nth-child(1)")) // first span
                        ;
                        $years = $("".concat($container, " > div > div.memorial-title > a > span:nth-child(2)")) // second span
                        ;
                        picture_url_lowres = $img.first().attr('src');
                        picture_url = picture_url_lowres.replace(/_.+/g, '_1920x1080_f985cc.jpg');
                        years = $years.contents().text();
                        date_birth = +((_a = years.split('-')[0]) === null || _a === void 0 ? void 0 : _a.replace('(', '').replace(' ', ''));
                        date_death = +((_b = years.split('-')[1]) === null || _b === void 0 ? void 0 : _b.replace(')', '').replace(' ', ''));
                        name_1 = $name.contents().text();
                        deads.push({ name: name_1, picture_url: picture_url, date_birth: date_birth, date_death: date_death });
                    }
                    // remove entries without date_birth and date_death
                    deads = deads.filter(function (d) { return d.date_birth && d.date_death; });
                    _loop_1 = function (dead) {
                        var insert_query;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    if (!obituaries_already_in_db.rows.find(function (o) { return o.name === dead.name; })) return [3 /*break*/, 1];
                                    return [2 /*return*/, "continue"];
                                case 1:
                                    insert_query = "INSERT INTO obituaries(name, picture_url, date_birth, date_death) VALUES ('".concat(dead.name, "','").concat(dead.picture_url, "','").concat(dead.date_birth, "','").concat(dead.date_death, "');");
                                    console.log(insert_query);
                                    return [4 /*yield*/, db_client.query(insert_query)];
                                case 2:
                                    _f.sent();
                                    _f.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _d = 0, deads_1 = deads;
                    _e.label = 4;
                case 4:
                    if (!(_d < deads_1.length)) return [3 /*break*/, 7];
                    dead = deads_1[_d];
                    return [5 /*yield**/, _loop_1(dead)];
                case 5:
                    _e.sent();
                    _e.label = 6;
                case 6:
                    _d++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, db_client.end()];
                case 8:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.scraper = scraper;
