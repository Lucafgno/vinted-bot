"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = exports.initialize = void 0;
const { config } = require("dotenv");
config();
const typeorm_1 = require("typeorm");
const initialize = () => (0, typeorm_1.createConnection)({
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    entities: [Subscription],
    synchronize: true,
});
exports.initialize = initialize;
let Subscription = class Subscription {
    id;
    url;
    channelId;
    isActive;
    latestItemDate;
    createdAt;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subscription.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 32,
    }),
    __metadata("design:type", String)
], Subscription.prototype, "channelId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Subscription.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "timestamp with time zone",
        nullable: true,
    }),
    __metadata("design:type", Date)
], Subscription.prototype, "latestItemDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "timestamp with time zone",
    }),
    __metadata("design:type", Date)
], Subscription.prototype, "createdAt", void 0);
Subscription = __decorate([
    (0, typeorm_1.Entity)()
], Subscription);
exports.Subscription = Subscription;
