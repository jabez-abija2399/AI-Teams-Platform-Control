# Database Architecture


Database:

PostgreSQL


ORM:

Prisma



# Main Entities


## User


Stores:

- Account
- Profile
- Settings



## Project


Stores:

- Software projects
- Status
- Owner



## Agent


Stores:

AI employees.


Fields:


- Name
- Role
- Instructions
- Status



## Task


Stores:

AI work items.


## Workflow


Stores:

AI development process.


## Document


Stores:

- Requirements
- Architecture
- Notes



## Repository


Stores:

Generated software projects.



## File


Stores:

Code files.



## Memory


Stores:

AI knowledge.



# Database Rules


Always consider:

- Relationships
- Indexes
- Security
- Future scaling
