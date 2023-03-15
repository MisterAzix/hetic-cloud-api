"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_status_1 = __importDefault(require("http-status"));
const child_process_1 = require("child_process");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
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
app.get('/api/users', (req, res) => {
    const cmd = "cut -d: -f1,3,6 /etc/passwd | awk -F: '$2 >= 1000 && $2 <= 60000' | cut -d: -f1,3";
    (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
        const users = stdout
            .trim()
            .split('\n')
            .map((line) => {
            const [name, home] = line.split(':');
            const sizeCmd = `sudo du -sh "${home}"`;
            const size = (0, child_process_1.execSync)(sizeCmd, { encoding: 'utf-8' }).trim().split('\t')[0];
            return { name, home, size };
        });
        res.writeHead(http_status_1.default.OK, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(users));
    });
});
app.post('/api/users', (req, res) => {
    const { username, id_rsa } = req.body;
    if (!username || !id_rsa) {
        return res
            .status(http_status_1.default.BAD_REQUEST)
            .send({ code: 'MISSING_PROPERTIES', message: 'Username or SSH key is missing!' });
    }
    (0, child_process_1.exec)(`sudo useradd -m ${username}`, (err) => {
        if (err) {
            return res
                .status(http_status_1.default.INTERNAL_SERVER_ERROR)
                .send({ code: 'USER_ALREADY_EXIST', message: 'User already exist!' });
        }
        (0, child_process_1.exec)(`sudo chmod 700 /home/${username}/.ssh`, (err) => {
            if (err) {
                return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).send({
                    code: 'SETTING_AUTHORIZATION_FAILED',
                    message: 'Cannot set authorizations to .ssh directory!',
                });
            }
            (0, child_process_1.exec)(`sudo chmod 600 /home/${username}/.ssh/authorized_keys`, (err) => {
                if (err) {
                    return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).send({
                        code: 'SETTING_AUTHORIZATION_FAILED',
                        message: 'Cannot set authorizations to authorized_keys file!',
                    });
                }
                (0, child_process_1.exec)(`echo "${id_rsa}" | sudo tee /home/${username}/.ssh/authorized_keys`, (err) => {
                    if (err) {
                        return res
                            .status(http_status_1.default.INTERNAL_SERVER_ERROR)
                            .send({ code: 'SSH_KEY_ADDITION_FAILED', message: 'SSH key cannot be added!' });
                    }
                    return res.sendStatus(http_status_1.default.OK);
                });
            });
        });
    });
});
app.listen(port, function () {
    console.log(`App is listening on port ${port} !`);
});
