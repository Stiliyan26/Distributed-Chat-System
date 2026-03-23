import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { CurrentUserId } from '@libs/shared/src/decorators/current-user-id.decorator';

import { PresenceRoutes } from '@libs/shared/src/constants/routes.constants';
import { GetUserStatusRequestDto } from "./dto/get-user-status.request.dto";
import { SocketConnectionRequestDto } from "./dto/socket-connection.request.dto";
import { PresenceService } from "./presence.service";

@Controller(PresenceRoutes.PREFIX)
export class PresenceController {

    constructor(private readonly presenceService: PresenceService) { }

    @Post(PresenceRoutes.STATUS)
    @HttpCode(HttpStatus.OK)
    getUsersStatus(@Body() getStatusDto: GetUserStatusRequestDto) {
        return this.presenceService.getUsersStatus(getStatusDto.userIds);
    }

    @Post(PresenceRoutes.ONLINE)
    @HttpCode(HttpStatus.CREATED)
    async markOnline(
        @Body() socketConnectionRequestDto: SocketConnectionRequestDto,
        @CurrentUserId() userId: string
    ) {
        return this.presenceService.markOnline(socketConnectionRequestDto.socketId, userId);
    }

    @Post(PresenceRoutes.OFFLINE)
    @HttpCode(HttpStatus.NO_CONTENT)
    async markOffline(
        @Body() socketConnectionRequestDto: SocketConnectionRequestDto,
        @CurrentUserId() userId: string
    ) {
        return this.presenceService.markOffline(socketConnectionRequestDto.socketId, userId);
    }

    @Post(PresenceRoutes.HEARTBEAT)
    @HttpCode(HttpStatus.ACCEPTED)
    async refreshHeartbeat(
        @Body() socketConnectionRequestDto: SocketConnectionRequestDto,
        @CurrentUserId() userId: string
    ) {
        return this.presenceService.refreshHeartbeat(socketConnectionRequestDto.socketId, userId);
    }
}
