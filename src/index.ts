import express, { Application, Request, Response } from 'express';
import HttpStatus from 'http-status';
import { exec, execSync } from 'child_process';

const app: Application = express();
const port = 3000;

app.get('/api/status', (req: Request, res: Response) => {
  res.sendStatus(HttpStatus.OK);
});

app.get('/api/meminfo', (req: Request, res: Response) => {
  exec('cat /proc/meminfo', (err, output) => {
    const lines = output.split('\n').filter((line) => line.trim() !== '');
    const data: { [key: string]: string } = {};

    lines.forEach((line) => {
      const parts = line.split(':');
      data[parts[0]] = parts[1].trim();
    });

    res.writeHead(HttpStatus.OK, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  });
});

app.get('/api/cpuinfo', (req: Request, res: Response) => {
  exec('cat /proc/cpuinfo', (err, output) => {
    const lines: string[] = output.split('\n').filter((line) => line.trim() !== '');
    const data: { [key: string]: string | number }[] = [];
    let cpu: { [key: string]: string | number } = {};

    lines.forEach((line) => {
      const parts = line.split(':');
      const key = parts[0].trim();
      const value = parts[1].trim();
      if (key === 'processor') {
        if (Object.keys(cpu).length > 0) {
          data.push(cpu);
        }
        cpu = { [key]: parseInt(value) };
      } else {
        cpu[key] = value;
      }
    });
    data.push(cpu);

    res.writeHead(HttpStatus.OK, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  });
});

app.get('/api/users', (req: Request, res: Response) => {
  const cmd = "cut -d: -f1,3,6 /etc/passwd | awk -F: '$2 >= 1000 && $2 <= 60000' | cut -d: -f1,3";
  exec(cmd, (err, stdout, stderr) => {
    const users = stdout
      .trim()
      .split('\n')
      .map((line) => {
        const [name, home] = line.split(':');
        const sizeCmd = `du -sh "${home}"`;
        const size = execSync(sizeCmd, { encoding: 'utf-8' }).trim().split('\t')[0];
        return { name, home, size };
      });

    res.writeHead(HttpStatus.OK, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(users));
  });
});

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`);
});
