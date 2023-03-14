"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_status_1 = __importDefault(require("http-status"));
const child_process_1 = require("child_process");
const app = (0, express_1.default)();
const port = 3000;
app.get('/api/status', (req, res) => {
    res.sendStatus(http_status_1.default.OK);
});
app.get('/api/meminfo', (req, res) => {
    (0, child_process_1.exec)('cat /proc/meminfo', (err, output) => {
        const lines = output.split('\n').filter((line) => line.trim() !== '');
        const data = {};
        lines.forEach((line) => {
            const parts = line.split(':');
            data[parts[0]] = parts[1].trim();
        });
        res.writeHead(http_status_1.default.OK, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(data));
    });
});
app.get('/api/cpuinfo', (req, res) => {
    (0, child_process_1.exec)('cat /proc/cpuinfo', (err, output) => {
        const lines = output.split('\n').filter((line) => line.trim() !== '');
        const data = [];
        let cpu = {};
        lines.forEach((line) => {
            const parts = line.split(':');
            const key = parts[0].trim();
            const value = parts[1].trim();
            if (key === 'processor') {
                if (Object.keys(cpu).length > 0) {
                    data.push(cpu);
                }
                cpu = { [key]: parseInt(value) };
            }
            else {
                cpu[key] = value;
            }
        });
        data.push(cpu);
        res.writeHead(http_status_1.default.OK, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(data));
    });
});
app.listen(port, function () {
    console.log(`App is listening on port ${port} !`);
});
