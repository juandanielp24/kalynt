import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyProgramService } from './loyalty-program.service';
import { LoyaltyTiersService } from './loyalty-tiers.service';
import { LoyaltyMembersService } from './loyalty-members.service';
import { LoyaltyRewardsService } from './loyalty-rewards.service';
import { PointsEngineService } from './points-engine.service';
import { RewardType, PointsTransactionType, RedemptionStatus } from '@retail/database';

@ApiTags('Loyalty')
@Controller('loyalty')
@ApiBearerAuth()
export class LoyaltyController {
  constructor(
    private programService: LoyaltyProgramService,
    private tiersService: LoyaltyTiersService,
    private membersService: LoyaltyMembersService,
    private rewardsService: LoyaltyRewardsService,
    private pointsEngine: PointsEngineService,
  ) {}

  // ==================== PROGRAMS ====================

  @Get('programs')
  @ApiOperation({ summary: 'Get all loyalty programs' })
  @ApiResponse({ status: 200, description: 'Returns all loyalty programs' })
  async getPrograms(
    @Request() req: any,
    @Query('isActive') isActive?: string
  ) {
    const tenantId = req.user?.tenantId;
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.programService.getPrograms(tenantId, active);
  }

  @Get('programs/active')
  @ApiOperation({ summary: 'Get active loyalty program' })
  @ApiResponse({ status: 200, description: 'Returns active loyalty program' })
  async getActiveProgram(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.programService.getActiveProgram(tenantId);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get loyalty program by ID' })
  @ApiResponse({ status: 200, description: 'Returns loyalty program' })
  async getProgram(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.programService.getProgram(id, tenantId);
  }

  @Post('programs')
  @ApiOperation({ summary: 'Create loyalty program' })
  @ApiResponse({ status: 201, description: 'Loyalty program created' })
  async createProgram(@Request() req: any, @Body() data: any) {
    const tenantId = req.user?.tenantId;
    return this.programService.createProgram(tenantId, data);
  }

  @Put('programs/:id')
  @ApiOperation({ summary: 'Update loyalty program' })
  @ApiResponse({ status: 200, description: 'Loyalty program updated' })
  async updateProgram(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: any
  ) {
    const tenantId = req.user?.tenantId;
    return this.programService.updateProgram(id, tenantId, data);
  }

  @Delete('programs/:id')
  @ApiOperation({ summary: 'Delete loyalty program' })
  @ApiResponse({ status: 200, description: 'Loyalty program deleted' })
  async deleteProgram(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.programService.deleteProgram(id, tenantId);
  }

  @Patch('programs/:id/toggle')
  @ApiOperation({ summary: 'Toggle program active status' })
  @ApiResponse({ status: 200, description: 'Program status toggled' })
  async toggleProgramStatus(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.programService.toggleProgramStatus(id, tenantId);
  }

  @Get('programs/:id/statistics')
  @ApiOperation({ summary: 'Get program statistics' })
  @ApiResponse({ status: 200, description: 'Returns program statistics' })
  async getProgramStatistics(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.programService.getProgramStatistics(id, tenantId);
  }

  // ==================== TIERS ====================

  @Get('programs/:programId/tiers')
  @ApiOperation({ summary: 'Get all tiers for a program' })
  @ApiResponse({ status: 200, description: 'Returns all tiers' })
  async getTiers(@Param('programId') programId: string) {
    return this.tiersService.getTiers(programId);
  }

  @Get('tiers/:id')
  @ApiOperation({ summary: 'Get tier by ID' })
  @ApiResponse({ status: 200, description: 'Returns tier' })
  async getTier(@Param('id') id: string) {
    return this.tiersService.getTier(id);
  }

  @Post('programs/:programId/tiers')
  @ApiOperation({ summary: 'Create tier' })
  @ApiResponse({ status: 201, description: 'Tier created' })
  async createTier(@Param('programId') programId: string, @Body() data: any) {
    return this.tiersService.createTier(programId, data);
  }

  @Put('tiers/:id')
  @ApiOperation({ summary: 'Update tier' })
  @ApiResponse({ status: 200, description: 'Tier updated' })
  async updateTier(@Param('id') id: string, @Body() data: any) {
    return this.tiersService.updateTier(id, data);
  }

  @Delete('tiers/:id')
  @ApiOperation({ summary: 'Delete tier' })
  @ApiResponse({ status: 200, description: 'Tier deleted' })
  async deleteTier(@Param('id') id: string) {
    return this.tiersService.deleteTier(id);
  }

  // ==================== MEMBERS ====================

  @Post('members/enroll')
  @ApiOperation({ summary: 'Enroll customer in loyalty program' })
  @ApiResponse({ status: 201, description: 'Customer enrolled' })
  async enrollCustomer(
    @Body() data: { programId: string; customerId: string }
  ) {
    return this.membersService.enrollCustomer(data.programId, data.customerId);
  }

  @Get('members/:id')
  @ApiOperation({ summary: 'Get member by ID' })
  @ApiResponse({ status: 200, description: 'Returns member' })
  async getMember(@Param('id') id: string) {
    return this.membersService.getMember(id);
  }

  @Get('members/:id/statistics')
  @ApiOperation({ summary: 'Get member statistics' })
  @ApiResponse({ status: 200, description: 'Returns member statistics' })
  async getMemberStatistics(@Param('id') id: string) {
    return this.membersService.getMemberStatistics(id);
  }

  @Get('programs/:programId/customers/:customerId/member')
  @ApiOperation({ summary: 'Get member by customer and program' })
  @ApiResponse({ status: 200, description: 'Returns member' })
  async getMemberByCustomer(
    @Param('programId') programId: string,
    @Param('customerId') customerId: string
  ) {
    return this.membersService.getMemberByCustomer(programId, customerId);
  }

  @Post('members/:id/points/add')
  @ApiOperation({ summary: 'Add points to member' })
  @ApiResponse({ status: 200, description: 'Points added' })
  async addPoints(
    @Param('id') id: string,
    @Body()
    data: {
      points: number;
      type: PointsTransactionType;
      description: string;
      saleId?: string;
    }
  ) {
    return this.membersService.addPoints(
      id,
      data.points,
      data.type,
      data.description,
      data.saleId
    );
  }

  @Post('members/:id/points/deduct')
  @ApiOperation({ summary: 'Deduct points from member' })
  @ApiResponse({ status: 200, description: 'Points deducted' })
  async deductPoints(
    @Param('id') id: string,
    @Body()
    data: {
      points: number;
      type: PointsTransactionType;
      description: string;
      redemptionId?: string;
    }
  ) {
    return this.membersService.deductPoints(
      id,
      data.points,
      data.type,
      data.description,
      data.redemptionId
    );
  }

  // ==================== REWARDS ====================

  @Get('programs/:programId/rewards')
  @ApiOperation({ summary: 'Get all rewards for a program' })
  @ApiResponse({ status: 200, description: 'Returns all rewards' })
  async getRewards(
    @Param('programId') programId: string,
    @Query('isActive') isActive?: string
  ) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.rewardsService.getRewards(programId, active);
  }

  @Get('rewards/:id')
  @ApiOperation({ summary: 'Get reward by ID' })
  @ApiResponse({ status: 200, description: 'Returns reward' })
  async getReward(@Param('id') id: string) {
    return this.rewardsService.getReward(id);
  }

  @Post('programs/:programId/rewards')
  @ApiOperation({ summary: 'Create reward' })
  @ApiResponse({ status: 201, description: 'Reward created' })
  async createReward(@Param('programId') programId: string, @Body() data: any) {
    return this.rewardsService.createReward(programId, data);
  }

  @Put('rewards/:id')
  @ApiOperation({ summary: 'Update reward' })
  @ApiResponse({ status: 200, description: 'Reward updated' })
  async updateReward(@Param('id') id: string, @Body() data: any) {
    return this.rewardsService.updateReward(id, data);
  }

  @Delete('rewards/:id')
  @ApiOperation({ summary: 'Delete reward' })
  @ApiResponse({ status: 200, description: 'Reward deleted' })
  async deleteReward(@Param('id') id: string) {
    return this.rewardsService.deleteReward(id);
  }

  @Patch('rewards/:id/toggle')
  @ApiOperation({ summary: 'Toggle reward active status' })
  @ApiResponse({ status: 200, description: 'Reward status toggled' })
  async toggleRewardStatus(@Param('id') id: string) {
    return this.rewardsService.toggleRewardStatus(id);
  }

  @Get('rewards/:id/statistics')
  @ApiOperation({ summary: 'Get reward statistics' })
  @ApiResponse({ status: 200, description: 'Returns reward statistics' })
  async getRewardStatistics(@Param('id') id: string) {
    return this.rewardsService.getRewardStatistics(id);
  }

  // ==================== REDEMPTIONS ====================

  @Post('redemptions/redeem')
  @ApiOperation({ summary: 'Redeem reward' })
  @ApiResponse({ status: 201, description: 'Reward redeemed' })
  async redeemReward(
    @Body() data: { memberId: string; rewardId: string }
  ) {
    return this.rewardsService.redeemReward(data.memberId, data.rewardId);
  }

  @Get('members/:memberId/redemptions')
  @ApiOperation({ summary: 'Get member redemptions' })
  @ApiResponse({ status: 200, description: 'Returns member redemptions' })
  async getMemberRedemptions(
    @Param('memberId') memberId: string,
    @Query('status') status?: RedemptionStatus
  ) {
    return this.rewardsService.getMemberRedemptions(memberId, status);
  }

  @Get('redemptions/code/:code')
  @ApiOperation({ summary: 'Get redemption by code' })
  @ApiResponse({ status: 200, description: 'Returns redemption' })
  async getRedemptionByCode(@Param('code') code: string) {
    return this.rewardsService.getRedemptionByCode(code);
  }

  @Post('redemptions/validate')
  @ApiOperation({ summary: 'Validate redemption code' })
  @ApiResponse({ status: 200, description: 'Returns validation result' })
  async validateRedemptionCode(@Body() data: { code: string }) {
    return this.rewardsService.validateRedemptionCode(data.code);
  }

  @Post('redemptions/use')
  @ApiOperation({ summary: 'Mark redemption as used' })
  @ApiResponse({ status: 200, description: 'Redemption marked as used' })
  async markRedemptionAsUsed(@Body() data: { code: string }) {
    return this.rewardsService.markRedemptionAsUsed(data.code);
  }

  @Post('redemptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel redemption' })
  @ApiResponse({ status: 200, description: 'Redemption cancelled' })
  async cancelRedemption(
    @Param('id') id: string,
    @Body() data: { reason?: string }
  ) {
    return this.rewardsService.cancelRedemption(id, data.reason);
  }

  // ==================== POINTS ENGINE ====================

  @Post('points/process-purchase')
  @ApiOperation({ summary: 'Process purchase and award points' })
  @ApiResponse({ status: 200, description: 'Points awarded' })
  async processPurchase(
    @Request() req: any,
    @Body()
    data: {
      customerId: string;
      saleId: string;
      amount: number;
    }
  ) {
    const tenantId = req.user?.tenantId;
    return this.pointsEngine.processPurchase(
      tenantId,
      data.customerId,
      data.saleId,
      data.amount
    );
  }

  @Post('points/referral')
  @ApiOperation({ summary: 'Award referral points' })
  @ApiResponse({ status: 200, description: 'Referral points awarded' })
  async awardReferralPoints(
    @Body()
    data: {
      programId: string;
      referrerId: string;
      refereeCustomerId: string;
    }
  ) {
    return this.pointsEngine.awardReferralPoints(
      data.programId,
      data.referrerId,
      data.refereeCustomerId
    );
  }

  @Post('points/adjust')
  @ApiOperation({ summary: 'Manual points adjustment' })
  @ApiResponse({ status: 200, description: 'Points adjusted' })
  async adjustPoints(
    @Request() req: any,
    @Body()
    data: {
      memberId: string;
      points: number;
      reason: string;
    }
  ) {
    const addedBy = req.user?.id;
    return this.pointsEngine.adjustPoints(
      data.memberId,
      data.points,
      data.reason,
      addedBy
    );
  }

  @Get('programs/:programId/leaderboard')
  @ApiOperation({ summary: 'Get program leaderboard' })
  @ApiResponse({ status: 200, description: 'Returns leaderboard' })
  async getLeaderboard(
    @Param('programId') programId: string,
    @Query('period') period?: 'all_time' | 'year' | 'month' | 'week',
    @Query('limit') limit?: number
  ) {
    return this.pointsEngine.getLeaderboard(
      programId,
      period || 'all_time',
      limit ? parseInt(limit.toString()) : 50
    );
  }

  @Get('programs/:programId/points-summary')
  @ApiOperation({ summary: 'Get points summary for program' })
  @ApiResponse({ status: 200, description: 'Returns points summary' })
  async getPointsSummary(@Param('programId') programId: string) {
    return this.pointsEngine.getPointsSummary(programId);
  }

  @Post('points/calculate-value')
  @ApiOperation({ summary: 'Calculate points value in currency' })
  @ApiResponse({ status: 200, description: 'Returns points value' })
  async calculatePointsValue(
    @Body() data: { programId: string; points: number }
  ) {
    return this.pointsEngine.calculatePointsValue(data.programId, data.points);
  }

  @Get('members/:memberId/activity')
  @ApiOperation({ summary: 'Get member activity summary' })
  @ApiResponse({ status: 200, description: 'Returns activity summary' })
  async getMemberActivity(
    @Param('memberId') memberId: string,
    @Query('days') days?: number
  ) {
    return this.pointsEngine.getMemberActivity(
      memberId,
      days ? parseInt(days.toString()) : 30
    );
  }
}
