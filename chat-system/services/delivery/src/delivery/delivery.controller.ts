import { Body, Controller, Get, Head, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { DeliveryRoutes } from '@libs/shared/src/constants/routes.constants';
import { DeliveryService } from "./delivery.service";
import { DeliverMessageRequestDto } from "./dto/deliver-message.request.dto";

@Controller(DeliveryRoutes.PREFIX)
export class DeliveryController {

    constructor(private readonly deliveryService: DeliveryService) { }

    @Post(DeliveryRoutes.RECEIVE)
    @HttpCode(HttpStatus.ACCEPTED)
    receiveMessage(@Body() deliverMessageRequestDto: DeliverMessageRequestDto) {
        return this.deliveryService.deliverMessage(deliverMessageRequestDto);
    }
}

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
