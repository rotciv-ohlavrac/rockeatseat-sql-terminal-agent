import { createWriteStream, statSync } from "node:fs";
import { faker } from "@faker-js/faker";

type User = {
  id: string;
  ip: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  job_area: string;
  company: string;
  job_title: string;
};

type UserEntryLog = User & { timestamp: string };

const LOG_FILE = "access.log";
const LOG_INTERVAL = 1 * 1000;
const maxRecords = Number(process.argv[2] || Infinity);

if (
  (!Number.isInteger(maxRecords) && Number.isFinite(maxRecords)) ||
  Number.isNaN(maxRecords) ||
  maxRecords <= 0
) {
  console.error("Uso: npm run seed -- <quantidade>");
  console.error("A quantidade deve ser um número inteiro maior que zero.");
  process.exit(1);
}

const stream = createWriteStream(LOG_FILE);

function generateUser(): User {
  return {
    ip: faker.internet.ip(),
    username: faker.internet.userName(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    location: faker.location.city(),
    job_area: faker.person.jobArea(),
    company: faker.company.name(),
    job_title: faker.person.jobTitle(),
    id: faker.string.uuid(),
  };
}

function generateLogEntry(user: User): UserEntryLog {
  return { ...user, timestamp: faker.date.recent().toISOString() };
}

function writeRecord(line: string) {
  return new Promise<void>((resolve) => {
    if (!stream.write(line)) {
      stream.once("drain", resolve);
    } else {
      resolve();
    }
  });
}

function convertFromBytesToGB(bytes: number) {
  return (bytes / 1024 / 1024 / 1024).toFixed();
}

console.log(
  `Gerando logs de acessos falsos em ${LOG_FILE}... (Ctrl+C para parar)`,
);
console.log(
  `Limite de registros ${maxRecords === Infinity ? "ilimitado" : maxRecords}`,
);

const users = Array.from({ length: 5 }, generateUser);

process.on("SIGINT", () => {
  stream.end(() => {
    const { size } = statSync(LOG_FILE);
    console.log(
      `Geração interrompida. Registros: ${count.toLocaleString()} | Tamanho do arquivo: ${convertFromBytesToGB(size)} GB`,
    );
  });
});

let count = 0;

while (count < maxRecords) {
  const user = faker.helpers.arrayElement(users);
  const record = generateLogEntry(user);

  await writeRecord(JSON.stringify(record) + "\n");
  count++;

  if (count % LOG_INTERVAL === 0) {
    const { size } = statSync(LOG_FILE);
    console.log(
      `Registros: ${count.toLocaleString()} | Tamanho do arquivo: ${convertFromBytesToGB(size)} GB`,
    );
  }
}

stream.end(() => {
  const { size } = statSync(LOG_FILE);
  console.log(
    `Geração concluída. Registros: ${count.toLocaleString()} | Tamanho do arquivo: ${convertFromBytesToGB(size)} GB`,
  );
});
