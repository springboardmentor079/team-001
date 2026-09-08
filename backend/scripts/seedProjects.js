const db = require('../db');

const projects = [
  {
    project_code: 'PRJ-101',
    name: 'Helix Commercial Tower',
    location: 'Metro Zone A',
    budget: 4200000,
    progress: 74,
    status: 'On Track',
    manager: 'Marcus Vance'
  },
  {
    project_code: 'PRJ-102',
    name: 'Riverside Residential Complex',
    location: 'Riverside District',
    budget: 2800000,
    progress: 58,
    status: 'On Track',
    manager: 'Sarah Mitchell'
  },
  {
    project_code: 'PRJ-103',
    name: 'Northside Infrastructure',
    location: 'Northside Zone',
    budget: 6100000,
    progress: 41,
    status: 'Delayed',
    manager: 'David Wilson'
  }
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO projects
  (project_code, name, location, budget, progress, status, manager)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const project of projects) {
  insert.run(
    project.project_code,
    project.name,
    project.location,
    project.budget,
    project.progress,
    project.status,
    project.manager
  );
}

console.log('Projects inserted successfully.');

const allProjects = db.prepare('SELECT * FROM projects').all();

console.table(allProjects);