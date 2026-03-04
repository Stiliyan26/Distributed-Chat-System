import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { DeliveryRoutes } from '@libs/shared/src/constants/routes.constants';
import { DeliveryService } from "./delivery.service";
import { DeliverMessageRequestDto } from "./dto/deliver.request.dto";

@Controller(DeliveryRoutes.PREFIX)
export class DeliveryController {

    constructor(private readonly deliveryService: DeliveryService) { }

    @Post(DeliveryRoutes.RECIEVE)
    @HttpCode(HttpStatus.ACCEPTED)
    recieveMessage(@Body() deliverMessageDto: DeliverMessageRequestDto) {
        return this.deliveryService.deliverMessage(deliverMessageDto);
    }
}
