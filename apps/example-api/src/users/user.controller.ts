import { Controller, Http, Body, Param, Status } from "@ambrosia/http";
import type { CreateUserDto } from "./dto/create-user.dto.ts";
import { UserService } from "./user.service.ts";

/**
 * User controller — REST endpoints for user management.
 *
 * All routes are public (no auth guard).
 */
@Controller("/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /users — create a new user
   */
  @Http.Post()
  @Status(201)
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  /**
   * GET /users — list all users
   */
  @Http.Get()
  findAll() {
    return this.userService.findAll();
  }

  /**
   * GET /users/:id — get user by id
   */
  @Http.Get("/:id")
  findOne(@Param("id") id: string) {
    return this.userService.findById(id);
  }
}
