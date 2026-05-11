import { Controller, Get, Head } from "@nestjs/common";

@Controller()
export class DeliveryHealthController {
  @Get()
  root() {
    return {
      service: "delivery-service",
      status: "ok",
    };
  }

  @Head()
  headRoot() {
    return;
  }

  @Get("health")
  health() {
    return {
      service: "delivery-service",
      status: "ok",
    };
  }
}
