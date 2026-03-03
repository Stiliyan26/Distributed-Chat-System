import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { CurrentUserId } from '@libs/shared/src/decorators/current-user-id.decorator';

import { PresenceRoutes } from '@libs/shared/src/constants/routes.constants';
import { GetUserStatusRequestDto } from "../dto/get-user-status.request.dto";
import { SocketDto } from "../dto/socket.dto";
import { PresenceService } from "../services/presence.service";

@Controller(PresenceRoutes.PREFIX)
export class PresenceController {

    constructor(private readonly presenceService: PresenceService) { }

    @Post(PresenceRoutes.STATUS)
    getUsersStatus(@Body() getStatusDto: GetUserStatusRequestDto) {
        return this.presenceService.getUsersStatus(getStatusDto.userIds);
    }

    @Post(PresenceRoutes.ONLINE)
    @HttpCode(HttpStatus.CREATED)
    async markOnline(
        @Body() socketDto: SocketDto,
        @CurrentUserId() userId: string
    ) {
        return this.presenceService.markOnline(socketDto.socketId, userId);
    }

    @Post(PresenceRoutes.OFFLINE)
    @HttpCode(HttpStatus.NO_CONTENT)
    async markOffline(
        @Body() socketDto: SocketDto,
        @CurrentUserId() userId: string
    ) {
        return this.presenceService.markOffline(socketDto.socketId, userId);
    }

    @Post(PresenceRoutes.HEARTBEAT)
    @HttpCode(HttpStatus.OK)
    async refreshHeartbeat(
        @Body() socketDto: SocketDto,
        @CurrentUserId() userId: string
    ) {
        return this.presenceService.refreshHeartbeat(socketDto.socketId, userId);
    }
}   