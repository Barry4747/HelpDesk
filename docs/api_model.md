| Metoda | Endpoint                            | Opis                 |
| --------| -------------------------------------| ----------------------|
| POST   | /api/v1/auth/login                  | Login                |
| POST   | /api/v1/auth/refresh                | Refresh Token        |
| POST   | /api/v1/auth/logout                 | Logout User          |
| POST   | /api/v1/auth/change-password        | Change Password      |
| GET    | /api/v1/users/me                    | Get Me               |
| POST   | /api/v1/users                       | Create User          |
| GET    | /api/v1/users                       | List Users           |
| GET    | /api/v1/users/{user_id}             | Get User             |
| PATCH  | /api/v1/users/{user_id}             | Update User          |
| DELETE | /api/v1/users/{user_id}             | Deactivate User      |
| POST   | /api/v1/tickets                     | Create Ticket        |
| GET    | /api/v1/tickets                     | List Tickets         |
| GET    | /api/v1/tickets/{ticket_id}         | Get Ticket           |
| PATCH  | /api/v1/tickets/{ticket_id}         | Update Ticket        |
| DELETE | /api/v1/tickets/{ticket_id}         | Delete Ticket        |
| PATCH  | /api/v1/tickets/{ticket_id}/status  | Change Ticket Status |
| POST   | /api/v1/categories                  | Create Category      |
| GET    | /api/v1/categories                  | List Categories      |
| PATCH  | /api/v1/categories/{category_id}    | Update Category      |
| POST   | /api/v1/departments                 | Create Department    |
| GET    | /api/v1/departments                 | List Departments     |
| PATCH  | /api/v1/departments/{department_id} | Update Department    |
| GET    | /api/v1/stats/overview              | Get Overview         |
| GET    | /api/v1/stats/workload              | Get Workload         |
| GET    | /health                             | Health               |