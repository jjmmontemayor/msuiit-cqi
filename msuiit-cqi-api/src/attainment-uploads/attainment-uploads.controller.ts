import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttainmentUploadsService } from './attainment-uploads.service';
import { UploadAttainmentSheetDto } from './dto/upload-attainment-sheet.dto';

@Controller('attainment-uploads')
export class AttainmentUploadsController {
  constructor(private readonly attainmentUploadsService: AttainmentUploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAttainmentSheetDto,
  ) {
    return this.attainmentUploadsService.upload(file, dto);
  }
}
