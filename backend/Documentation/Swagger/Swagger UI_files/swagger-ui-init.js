
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "Tournify API",
      "version": "1.0.0",
      "description": "API for managing tournaments and users"
    },
    "servers": [
      {
        "url": "http://localhost:3000"
      }
    ],
    "paths": {
      "/auth/register": {
        "post": {
          "summary": "Register a new user",
          "tags": [
            "Auth"
          ],
          "description": "Registers a new user, stores their preferences, and returns a JWT token along with the user ID.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "first_name",
                    "last_name",
                    "email",
                    "password",
                    "preferred_location",
                    "preferred_longitude",
                    "preferred_latitude"
                  ],
                  "properties": {
                    "first_name": {
                      "type": "string",
                      "example": "Jane"
                    },
                    "last_name": {
                      "type": "string",
                      "example": "Smith"
                    },
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "jane.smith@email.com"
                    },
                    "password": {
                      "type": "string",
                      "description": "User's plain text password (will be hashed before saving)",
                      "example": "myStrongPassword123"
                    },
                    "preferred_location": {
                      "type": "string",
                      "example": "Los Angeles"
                    },
                    "preferred_longitude": {
                      "type": "number",
                      "format": "float",
                      "example": -118.2437
                    },
                    "preferred_latitude": {
                      "type": "number",
                      "format": "float",
                      "example": 34.0522
                    },
                    "preferences": {
                      "type": "array",
                      "items": {
                        "type": "integer"
                      },
                      "description": "List of sport IDs the user prefers",
                      "example": [
                        1,
                        2,
                        3
                      ]
                    },
                    "image_path": {
                      "type": "string",
                      "description": "Optional path to the user's profile image",
                      "example": "/uploads/profile123.jpg"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "User successfully registered",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "token": {
                        "type": "string",
                        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
                        "description": "JWT token for authentication"
                      },
                      "user": {
                        "type": "object",
                        "description": "Created user object",
                        "properties": {
                          "id": {
                            "type": "integer",
                            "example": 2
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Bad request – Missing or invalid fields"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/auth/login": {
        "post": {
          "summary": "Log in a user",
          "tags": [
            "Auth"
          ],
          "description": "Authenticates a user using email and password, and returns a JWT token if valid.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "email",
                    "password"
                  ],
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "jane.smith@email.com"
                    },
                    "password": {
                      "type": "string",
                      "description": "User's password (plaintext)",
                      "example": "myStrongPassword123"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful login",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "token": {
                        "type": "string",
                        "description": "JWT token for authenticated user",
                        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      },
                      "user": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "integer",
                            "example": 2
                          },
                          "email": {
                            "type": "string",
                            "example": "jane.smith@email.com"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized – Invalid email or password"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/tournaments/categories": {
        "get": {
          "summary": "Retrieve all sport categories",
          "tags": [
            "Tournaments"
          ],
          "description": "Fetches a list of all available sport categories, including their names and associated images.",
          "operationId": "getAllCategories",
          "responses": {
            "200": {
              "description": "A list of sport categories.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "example": 1
                        },
                        "category_name": {
                          "type": "string",
                          "example": "Football"
                        },
                        "category_image": {
                          "type": "string",
                          "example": "football.png"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Sport categories not found"
            },
            "500": {
              "description": "Internal Server Error - Something went wrong with the server."
            }
          }
        }
      },
      "/category/images/{filename}": {
        "get": {
          "summary": "Get a category image (optionally in grayscale)",
          "tags": [
            "Images"
          ],
          "description": "Serves a tournament category image from the server. Can be converted to grayscale via query parameter.",
          "parameters": [
            {
              "in": "path",
              "name": "filename",
              "required": true,
              "description": "Name of the image file to retrieve",
              "schema": {
                "type": "string",
                "example": "football.jpg"
              }
            },
            {
              "in": "query",
              "name": "grayscale",
              "required": false,
              "description": "If true, returns the image in grayscale",
              "schema": {
                "type": "boolean",
                "example": true
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Image returned successfully.",
              "content": {
                "image/jpeg": {
                  "schema": {
                    "type": "string",
                    "format": "binary"
                  }
                }
              }
            },
            "404": {
              "description": "Image not found."
            },
            "500": {
              "description": "Failed to process image."
            }
          }
        }
      },
      "/uploads/{filename}": {
        "get": {
          "summary": "Get a user-uploaded image (optionally in grayscale)",
          "tags": [
            "Images"
          ],
          "description": "Serves a user-uploaded profile or content image. Can be converted to grayscale via query parameter.",
          "parameters": [
            {
              "in": "path",
              "name": "filename",
              "required": true,
              "description": "Name of the uploaded image file to retrieve",
              "schema": {
                "type": "string",
                "example": "user123.png"
              }
            },
            {
              "in": "query",
              "name": "grayscale",
              "required": false,
              "description": "If true, returns the image in grayscale",
              "schema": {
                "type": "boolean",
                "example": true
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Image returned successfully.",
              "content": {
                "image/jpeg": {
                  "schema": {
                    "type": "string",
                    "format": "binary"
                  }
                }
              }
            },
            "404": {
              "description": "Image not found."
            },
            "500": {
              "description": "Failed to process image."
            }
          }
        }
      },
      "/tournaments": {
        "get": {
          "summary": "Get all tournaments with sport category filter excluding user’s assigned and owned tournaments",
          "tags": [
            "Tournaments"
          ],
          "description": "Returns a list of tournaments filtered by sport category, excluding tournaments the user is already part of or owns.",
          "parameters": [
            {
              "in": "query",
              "name": "category_id",
              "required": true,
              "description": "ID of the sport category to filter tournaments.",
              "example": 2,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "user_id",
              "required": true,
              "description": "ID of the user to exclude tournaments they are already assigned to or own.",
              "example": 1,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "List of tournaments retrieved successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "example": 1
                        },
                        "tournament_name": {
                          "type": "string",
                          "example": "Summer Basketball Championship"
                        },
                        "date": {
                          "type": "string",
                          "format": "date-time",
                          "example": "2025-07-10T10:00:00Z"
                        },
                        "latitude": {
                          "type": "number",
                          "format": "float",
                          "example": 34.0522
                        },
                        "longitude": {
                          "type": "number",
                          "format": "float",
                          "example": -118.2437
                        },
                        "category_image": {
                          "type": "string",
                          "example": "/images/basketball.png"
                        }
                      }
                    }
                  }
                }
              }
            },
            "204": {
              "description": "No tournaments found."
            },
            "500": {
              "description": "Internal server error."
            }
          }
        },
        "post": {
          "summary": "Create a new tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Adds a new tournament to the database and returns its ID.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "owner_id",
                    "tournament_name",
                    "category_id",
                    "location_name",
                    "latitude",
                    "longitude",
                    "level",
                    "max_team_size",
                    "game_setting",
                    "entry_fee",
                    "prize_description",
                    "is_public",
                    "additional_info",
                    "status",
                    "date"
                  ],
                  "properties": {
                    "owner_id": {
                      "type": "integer",
                      "description": "ID of the tournament owner.",
                      "example": 5
                    },
                    "tournament_name": {
                      "type": "string",
                      "example": "Summer Basketball Championship"
                    },
                    "category_id": {
                      "type": "integer",
                      "description": "ID of the sport category.",
                      "example": 2
                    },
                    "location_name": {
                      "type": "string",
                      "example": "Los Angeles Sports Arena"
                    },
                    "latitude": {
                      "type": "number",
                      "format": "float",
                      "example": 34.0522
                    },
                    "longitude": {
                      "type": "number",
                      "format": "float",
                      "example": -118.2437
                    },
                    "level": {
                      "type": "string",
                      "example": "Amateur"
                    },
                    "max_team_size": {
                      "type": "integer",
                      "example": 5
                    },
                    "game_setting": {
                      "type": "string",
                      "example": "Outdoor"
                    },
                    "entry_fee": {
                      "type": "number",
                      "format": "float",
                      "example": 20
                    },
                    "prize_description": {
                      "type": "string",
                      "example": "Trophy and cash prize"
                    },
                    "is_public": {
                      "type": "boolean",
                      "example": true
                    },
                    "additional_info": {
                      "type": "string",
                      "example": "Bring your own jerseys"
                    },
                    "status": {
                      "type": "string",
                      "example": "Upcoming"
                    },
                    "date": {
                      "type": "string",
                      "format": "date-time",
                      "example": "2025-07-10T10:00:00Z"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Tournament created successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "integer",
                        "example": 1
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Bad request, missing required fields."
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/tournaments/{id}/teams/count": {
        "get": {
          "summary": "Get the count of teams enrolled in a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Retrieves the total number of teams that are enrolled in a specific tournament.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "type": "integer",
              "description": "The ID of the tournament."
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved the number of teams for the tournament",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "team_count": {
                          "type": "integer",
                          "description": "The total number of teams in the tournament",
                          "example": 10
                        }
                      }
                    }
                  }
                }
              }
            },
            "204": {
              "description": "No teams found for the specified tournament"
            },
            "500": {
              "description": "Internal server error, failed to retrieve data."
            }
          }
        }
      },
      "/tournaments/{id}/info": {
        "get": {
          "summary": "Get tournament info by ID",
          "tags": [
            "Tournaments"
          ],
          "description": "Returns detailed information about a specific tournament based on its ID.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true,
              "description": "The unique ID of the tournament.",
              "example": 1
            }
          ],
          "responses": {
            "200": {
              "description": "Tournament details retrieved successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "integer",
                        "example": 1
                      },
                      "tournament_name": {
                        "type": "string",
                        "example": "Summer Basketball Championship"
                      },
                      "location_name": {
                        "type": "string",
                        "example": "Los Angeles Sports Arena"
                      },
                      "latitude": {
                        "type": "number",
                        "format": "float",
                        "example": 34.0522
                      },
                      "longitude": {
                        "type": "number",
                        "format": "float",
                        "example": -118.2437
                      },
                      "level": {
                        "type": "string",
                        "example": "Amateur"
                      },
                      "max_team_size": {
                        "type": "integer",
                        "example": 5
                      },
                      "game_setting": {
                        "type": "string",
                        "example": "Outdoor"
                      },
                      "entry_fee": {
                        "type": "number",
                        "format": "float",
                        "example": 20
                      },
                      "prize_description": {
                        "type": "string",
                        "example": "Trophy and cash prize"
                      },
                      "is_public": {
                        "type": "boolean",
                        "example": true
                      },
                      "additional_info": {
                        "type": "string",
                        "example": "Bring your own jerseys"
                      },
                      "status": {
                        "type": "string",
                        "example": "Upcoming"
                      },
                      "date": {
                        "type": "string",
                        "format": "date-time",
                        "example": "2025-07-10T10:00:00Z"
                      },
                      "category_name": {
                        "type": "string",
                        "example": "Basketball"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found."
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/tournaments/{id}/leaderboard": {
        "get": {
          "summary": "Get leaderboard for a specific tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Retrieves all leaderboard records for a given tournament by its ID.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "The ID of the tournament whose leaderboard records are to be fetched.",
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved leaderboard records for the tournament",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "tournament_id": {
                          "type": "integer",
                          "description": "ID of the tournament"
                        },
                        "team_id": {
                          "type": "integer",
                          "description": "ID of the team"
                        },
                        "position": {
                          "type": "integer",
                          "description": "Position of the team in the leaderboard"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/tournaments/{id}/enrolled": {
        "get": {
          "summary": "Get a list of teams enrolled in a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Retrieves a list of teams enrolled in a specific tournament, along with the number of members in each team.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true,
              "description": "The ID of the tournament.",
              "example": 1
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved list of teams and their members",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "integer",
                        "example": 1
                      },
                      "team_name": {
                        "type": "string",
                        "description": "The name of the team",
                        "example": "Team A"
                      },
                      "number_of_members": {
                        "type": "integer",
                        "description": "The number of members in the team",
                        "example": 5
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "No teams found for this tournament"
            },
            "500": {
              "description": "Internal server error, failed to retrieve data."
            }
          }
        }
      },
      "/tournaments/leaderboard/add": {
        "post": {
          "summary": "Add a new record to the leaderboard",
          "tags": [
            "Tournaments"
          ],
          "description": "Adds a new team record to the leaderboard for a specific tournament and position.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "tournament_id",
                    "team_id",
                    "position"
                  ],
                  "properties": {
                    "tournament_id": {
                      "type": "integer",
                      "description": "The ID of the tournament.",
                      "example": 1
                    },
                    "team_id": {
                      "type": "integer",
                      "description": "The ID of the team.",
                      "example": 3
                    },
                    "position": {
                      "type": "integer",
                      "description": "The position of the team in the tournament.",
                      "example": 2
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Record added to the leaderboard.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Record added to leaderboard"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Invalid input, missing required fields or invalid data."
            },
            "500": {
              "description": "Internal server error, failed to add record."
            }
          }
        }
      },
      "/tournaments/{id}/register": {
        "post": {
          "summary": "Register a team for a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Registers a team with a name and a user for a specific tournament. Generates a unique team code and a ticket for the user.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "type": "integer",
              "description": "The ID of the tournament."
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "team_name"
                  ],
                  "properties": {
                    "team_name": {
                      "type": "string",
                      "description": "The name of the team.",
                      "example": "Team A"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successfully registered team and user",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Team and member registered"
                      },
                      "team_code": {
                        "type": "string",
                        "description": "The unique code generated for the team",
                        "example": "U8ED45NH"
                      },
                      "ticket": {
                        "type": "string",
                        "description": "The unique ticket hash for the user",
                        "example": "TICKET123456"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Invalid input, missing required fields or invalid data."
            },
            "500": {
              "description": "Internal server error, failed to register team."
            }
          }
        }
      },
      "/tournaments/{id}/join_team": {
        "post": {
          "summary": "Join a team at a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Adds a user to an existing team in a tournament by providing the team code.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "type": "integer",
              "description": "The ID of the tournament."
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "code"
                  ],
                  "properties": {
                    "code": {
                      "type": "string",
                      "description": "The code of the team the user wants to join.",
                      "example": "ABCD123"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successfully added user to the team",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "User added to the team"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "The team is already full"
            },
            "404": {
              "description": "Team or tournament not found"
            },
            "500": {
              "description": "Internal server error, failed to add user to the team."
            }
          }
        }
      },
      "/tournaments/{id}/check-tickets": {
        "post": {
          "summary": "Check if a ticket exists for a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "This endpoint checks whether a ticket exists for the provided tournament.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "description": "The tournament ID to check against.",
              "required": true,
              "type": "string"
            },
            {
              "name": "ticket",
              "in": "body",
              "description": "The ticket code to check.",
              "required": true,
              "schema": {
                "type": "object",
                "properties": {
                  "ticket": {
                    "type": "string",
                    "example": "9HFBDAS24"
                  }
                }
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Ticket found",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "integer",
                        "example": 11
                      },
                      "user_id": {
                        "type": "integer",
                        "example": 60
                      },
                      "team_id": {
                        "type": "integer",
                        "example": 14
                      },
                      "tournament_id": {
                        "type": "integer",
                        "example": 62
                      },
                      "ticket": {
                        "type": "string",
                        "example": "9HFBDAS24"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Ticket not found"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/tournaments/{id}/edit": {
        "put": {
          "summary": "Edit an existing tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Updates the information of an existing tournament.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "ID of the tournament to be updated.",
              "schema": {
                "type": "integer",
                "example": 1
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "tournament_name",
                    "category_id",
                    "location_name",
                    "latitude",
                    "longitude",
                    "level",
                    "max_team_size",
                    "game_setting",
                    "entry_fee",
                    "prize_description",
                    "is_public",
                    "additional_info"
                  ],
                  "properties": {
                    "tournament_name": {
                      "type": "string",
                      "example": "Summer Basketball Championship"
                    },
                    "category_id": {
                      "type": "integer",
                      "description": "ID of the sport category.",
                      "example": 2
                    },
                    "location_name": {
                      "type": "string",
                      "example": "Los Angeles Sports Arena"
                    },
                    "latitude": {
                      "type": "number",
                      "format": "float",
                      "example": 34.0522
                    },
                    "longitude": {
                      "type": "number",
                      "format": "float",
                      "example": -118.2437
                    },
                    "level": {
                      "type": "string",
                      "example": "Amateur"
                    },
                    "max_team_size": {
                      "type": "integer",
                      "example": 5
                    },
                    "game_setting": {
                      "type": "string",
                      "example": "Outdoor"
                    },
                    "entry_fee": {
                      "type": "number",
                      "format": "float",
                      "example": 20
                    },
                    "prize_description": {
                      "type": "string",
                      "example": "Trophy and cash prize"
                    },
                    "is_public": {
                      "type": "boolean",
                      "example": true
                    },
                    "additional_info": {
                      "type": "string",
                      "example": "Bring your own jerseys"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Tournament updated successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Tournament updated successfully"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found."
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/tournaments/{id}/start": {
        "put": {
          "summary": "Start a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Updates the status of a tournament to \"Ongoing\" based on the tournament ID.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "The ID of the tournament to start",
              "schema": {
                "type": "integer",
                "example": 2
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Tournament started successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Tournament started successfully"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found."
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/tournaments/{id}/notify-start": {
        "post": {
          "summary": "Send start notifications to all users in a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Sends push notifications to all users registered in the tournament that it has started.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "The ID of the tournament",
              "schema": {
                "type": "integer",
                "example": 1
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Notifications sent successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Notifications sent to 8 users"
                      },
                      "total": {
                        "type": "integer",
                        "example": 8
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found."
            },
            "500": {
              "description": "Failed to send notifications."
            }
          }
        }
      },
      "/tournaments/{id}/stop": {
        "put": {
          "summary": "Stop a tournament",
          "tags": [
            "Tournaments"
          ],
          "description": "Updates the status of a tournament to \"Closed\" based on the tournament ID.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "The ID of the tournament to stop",
              "schema": {
                "type": "integer",
                "example": 2
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Tournament stopped successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Tournament stopped successfully"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found."
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/tournaments/{id}/leaderboard/remove": {
        "delete": {
          "summary": "Remove a team from the leaderboard",
          "tags": [
            "Tournaments"
          ],
          "description": "Removes a team from the leaderboard for a specific tournament by the provided tournament ID and team ID.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "tournament_id",
                    "team_id"
                  ],
                  "properties": {
                    "tournament_id": {
                      "type": "integer",
                      "description": "The ID of the tournament.",
                      "example": 1
                    },
                    "team_id": {
                      "type": "integer",
                      "description": "The ID of the team to be removed.",
                      "example": 5
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Record removed from leaderboard"
            },
            "404": {
              "description": "Leaderboard record not found"
            },
            "500": {
              "description": "Internal server error, failed to remove record."
            }
          }
        }
      },
      "/users": {
        "get": {
          "summary": "Retrieve all users",
          "tags": [
            "Users"
          ],
          "description": "Returns a list of users with their details.",
          "responses": {
            "200": {
              "description": "A list of users.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "example": 2
                        },
                        "first_name": {
                          "type": "string",
                          "example": "Jane"
                        },
                        "last_name": {
                          "type": "string",
                          "example": "Smith"
                        },
                        "email": {
                          "type": "string",
                          "example": "jane.smith@email.com"
                        },
                        "password": {
                          "type": "string",
                          "description": "Hashed user password",
                          "example": "$2b$10$NHCkUIUr7M35glDvYIyNj.qbvOSQ11akitOFrYGP6mhhzhIqS52pe"
                        },
                        "preferred_location": {
                          "type": "string",
                          "example": "Los Angeles"
                        },
                        "preferred_longitude": {
                          "type": "number",
                          "format": "float",
                          "example": -118.2437
                        },
                        "preferred_latitude": {
                          "type": "number",
                          "format": "float",
                          "example": 34.0522
                        },
                        "created_at": {
                          "type": "string",
                          "format": "date-time",
                          "example": "2025-03-29T15:42:37.099Z"
                        },
                        "image_path": {
                          "type": "string",
                          "example": "imgs/2.png"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "User not found"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/users/{id}/info": {
        "get": {
          "summary": "Get user info by user ID",
          "tags": [
            "Users"
          ],
          "description": "Retrieves detailed information of a user based on their ID",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "The ID of the user to retrieve information for",
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "User information retrieved successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "integer",
                        "example": 2
                      },
                      "first_name": {
                        "type": "string",
                        "example": "Jane"
                      },
                      "last_name": {
                        "type": "string",
                        "example": "Smith"
                      },
                      "email": {
                        "type": "string",
                        "example": "jane.smith@gmail.com"
                      },
                      "preferred_longitude": {
                        "type": "number",
                        "example": -118.2437
                      },
                      "preferred_latitude": {
                        "type": "number",
                        "example": 24.0522
                      },
                      "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "example": "2025-03-29T15:42:37.099Z"
                      },
                      "image_path": {
                        "type": "string",
                        "example": "user/images/img.png"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "User not found"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/users/changePassword": {
        "put": {
          "summary": "Change user password",
          "tags": [
            "Users"
          ],
          "description": "Updates the password for a specific user based on their ID, after validating the old password.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "newPassword": {
                      "type": "string",
                      "description": "The new plain password (will be hashed by the server).",
                      "example": "newPlainPassword123"
                    },
                    "oldPassword": {
                      "type": "string",
                      "example": "oldPlainPassword123"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Password changed successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Password changed successfully"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Old password is incorrect"
            },
            "404": {
              "description": "User not found"
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/users/editProfile": {
        "put": {
          "summary": "Edit user profile",
          "tags": [
            "Users"
          ],
          "description": "Updates the user's profile information based on their ID.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "first_name",
                    "last_name"
                  ],
                  "properties": {
                    "first_name": {
                      "type": "string",
                      "example": "John"
                    },
                    "last_name": {
                      "type": "string",
                      "example": "Doe"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Profile updated successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Profile updated successfully"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Bad request"
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/users/editPreferences": {
        "put": {
          "summary": "Edit user preferences",
          "tags": [
            "Users"
          ],
          "description": "Updates the user's location preferences based on their ID.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "preferred_location",
                    "preferred_longitude",
                    "preferred_latitude"
                  ],
                  "properties": {
                    "preferred_location": {
                      "type": "string",
                      "example": "Los Angeles"
                    },
                    "preferred_longitude": {
                      "type": "number",
                      "format": "float",
                      "example": -118.2437
                    },
                    "preferred_latitude": {
                      "type": "number",
                      "format": "float",
                      "example": 34.0522
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Preferences updated successfully.",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "message": {
                        "type": "string",
                        "example": "Preferences updated successfully"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Bad request, missing required fields."
            },
            "500": {
              "description": "Internal server error."
            }
          }
        }
      },
      "/users/{id}/tournaments": {
        "get": {
          "summary": "Get all tournaments a user is registered for",
          "tags": [
            "Users"
          ],
          "description": "Retrieves all tournaments where a specific user is registered.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "The ID of the user whose tournaments you want to retrieve",
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved the tournaments the user is registered for",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "example": 11
                        },
                        "tournament_name": {
                          "type": "string",
                          "example": "Rugby Battle Cup"
                        },
                        "date": {
                          "type": "date",
                          "example": "2025-10-19T22:00:00.000Z"
                        },
                        "latitude": {
                          "type": "number",
                          "format": "float",
                          "example": 51.5074
                        },
                        "longitude": {
                          "type": "number",
                          "format": "float",
                          "example": -0.1278
                        },
                        "category_image": {
                          "type": "string",
                          "example": "rugby.png"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/users/{id}/tournaments/owned": {
        "get": {
          "summary": "Get a user's owned tournaments",
          "tags": [
            "Users"
          ],
          "description": "Retrieves a list of tournaments that are owned by the specified user.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "type": "integer",
              "description": "The ID of the user who owns the tournaments."
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved user's owned tournaments",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "description": "The ID of the tournament",
                          "example": 1
                        },
                        "tournament_name": {
                          "type": "string",
                          "description": "The name of the tournament",
                          "example": "Championship 2025"
                        },
                        "date": {
                          "type": "string",
                          "format": "date",
                          "description": "The date the tournament is scheduled to take place",
                          "example": "2025-05-01"
                        },
                        "latitude": {
                          "type": "number",
                          "format": "float",
                          "description": "The latitude of the tournament location",
                          "example": 40.7128
                        },
                        "longitude": {
                          "type": "number",
                          "format": "float",
                          "description": "The longitude of the tournament location",
                          "example": -74.006
                        },
                        "category_image": {
                          "type": "string",
                          "description": "The image associated with the tournament category",
                          "example": "category_image_url.jpg"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found"
            },
            "500": {
              "description": "Internal server error, failed to retrieve data."
            }
          }
        }
      },
      "/users/{id}/tournaments/history": {
        "get": {
          "summary": "Get a user's tournament history",
          "tags": [
            "Users"
          ],
          "description": "Retrieves a list of tournaments the user has participated in, along with their position and category image, for closed tournaments.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "type": "integer",
              "description": "The ID of the user."
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved user's tournament history",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "description": "The ID of the tournament",
                          "example": 1
                        },
                        "tournament_name": {
                          "type": "string",
                          "description": "The name of the tournament",
                          "example": "Tournament A"
                        },
                        "date": {
                          "type": "string",
                          "format": "date",
                          "description": "The date the tournament took place",
                          "example": "2025-04-01"
                        },
                        "position": {
                          "type": "integer",
                          "description": "The user's position in the tournament",
                          "example": 2
                        },
                        "category_image": {
                          "type": "string",
                          "description": "The image associated with the tournament category",
                          "example": "image_url.jpg"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Tournament not found"
            },
            "500": {
              "description": "Internal server error, failed to retrieve data."
            }
          }
        }
      },
      "/users/{id}/tickets": {
        "get": {
          "summary": "Get all tickets for a specific user",
          "tags": [
            "Users"
          ],
          "description": "Retrieves all tickets that belong to a specific user.",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "description": "The ID of the user whose tickets you want to retrieve",
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved the user's tickets",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "example": 11
                        },
                        "date": {
                          "type": "string",
                          "format": "date-time",
                          "example": "2025-03-29T15:42:37.099Z"
                        },
                        "category_image": {
                          "type": "string",
                          "example": "rugby.png"
                        }
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/users/{id}/tickets/{ticket_id}/qr": {
        "get": {
          "summary": "Get ticket details for QR generation",
          "tags": [
            "Users"
          ],
          "description": "Retrieves ticket information, including the associated team name and code, based on the provided ticket ID for a specific user.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "type": "integer",
              "description": "The ID of the user associated with the ticket."
            },
            {
              "name": "ticket_id",
              "in": "path",
              "required": true,
              "type": "integer",
              "description": "The ID of the ticket."
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved ticket details for QR generation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "ticket": {
                          "type": "string",
                          "description": "The ticket code",
                          "example": "TICKET123456"
                        },
                        "team_name": {
                          "type": "string",
                          "description": "The name of the team associated with the ticket",
                          "example": "Team A"
                        },
                        "code": {
                          "type": "string",
                          "description": "The unique code for the team",
                          "example": "TEAMCODE789"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "Ticket not found"
            },
            "500": {
              "description": "Internal server error, failed to retrieve data."
            }
          }
        }
      },
      "/users/check-email": {
        "get": {
          "summary": "Check if an email already exists in the system",
          "tags": [
            "Users"
          ],
          "description": "This endpoint checks if the provided email address is already registered in the system.",
          "parameters": [
            {
              "in": "query",
              "name": "email",
              "required": true,
              "schema": {
                "type": "string",
                "format": "email"
              },
              "description": "The email address to check"
            }
          ],
          "responses": {
            "200": {
              "description": "Email exists or is available",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "exists": {
                        "type": "boolean",
                        "description": "Indicates whether the email is already registered",
                        "example": true
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "description": "Internal Server Error - something went wrong with the server"
            }
          }
        }
      },
      "/users/{id}/top-picks": {
        "get": {
          "summary": "Get recommended tournaments for a user",
          "tags": [
            "Users"
          ],
          "description": "Returns a list of up to 5 upcoming tournaments based on the user's preferred sport categories and closest geographical location. Results are first filtered by distance and then sorted by the soonest date.",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              },
              "description": "The ID of the user whose tournament recommendations are being requested."
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved a list of recommended tournaments",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "integer",
                          "description": "Tournament ID",
                          "example": 12
                        },
                        "tournament_name": {
                          "type": "string",
                          "description": "Name of the tournament",
                          "example": "Streetball Open 2025"
                        },
                        "date": {
                          "type": "string",
                          "format": "date-time",
                          "description": "Date of the tournament",
                          "example": "2025-12-01T00:00:00.000Z"
                        },
                        "latitude": {
                          "type": "number",
                          "format": "float",
                          "description": "Latitude of the tournament location"
                        },
                        "longitude": {
                          "type": "number",
                          "format": "float",
                          "description": "Longitude of the tournament location"
                        },
                        "category_image": {
                          "type": "string"
                        },
                        "distance": {
                          "type": "string",
                          "description": "Distance in kilometers from the user's preferred location",
                          "example": "15.72"
                        }
                      }
                    }
                  }
                }
              }
            },
            "404": {
              "description": "User not found"
            },
            "500": {
              "description": "Internal server error, failed to retrieve recommended tournaments."
            }
          }
        }
      }
    },
    "components": {},
    "tags": [
      {
        "name": "Auth",
        "description": "User authentication and registration"
      },
      {
        "name": "Tournaments",
        "description": "Tournament management"
      },
      {
        "name": "Images",
        "description": "Image delivery and processing (e.g., category and uploaded images)"
      },
      {
        "name": "Users",
        "description": "Users management"
      }
    ]
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
