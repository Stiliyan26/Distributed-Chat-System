import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { PresenceRoutes } from '@libs/shared/src/constants/routes.constants';
import { GetUserStatusRequestDto } from "../dto/get-user-status.request.dto";
import { HeartbeatDto } from "../dto/heartbeat.request.dto";
import { MarkOnlineRequestDto } from "../dto/mark-online.request.dto";
import { OfflineRequestDto } from "../dto/offline.request.dto";
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
    async markOnline(@Body() markOnlineDto: MarkOnlineRequestDto) {
        return this.presenceService.markOnline(markOnlineDto);
    }

    @Post(PresenceRoutes.OFFLINE)
    @HttpCode(HttpStatus.NO_CONTENT)
    async markOffline(@Body() offlineDto: OfflineRequestDto) {
        return this.presenceService.markOffline(offlineDto);
    }

    @Post(PresenceRoutes.HEARTBEAT)
    @HttpCode(HttpStatus.OK)
    async refreshHeartbeat(@Body() heartbeatDto: HeartbeatDto) {
        return this.presenceService.refreshHeartbeat(heartbeatDto);
    }
}   