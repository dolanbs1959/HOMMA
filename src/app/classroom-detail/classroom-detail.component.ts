import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-classroom-detail',
  templateUrl: './classroom-detail.component.html',
  styleUrls: ['./classroom-detail.component.scss']
})
export class ClassroomDetailComponent implements OnInit {
  residentData: any = null;
  classRecord: any = null;
  participantId = '';
  curriculumError = '';
  isOpening = false;

  constructor(
    private router: Router,
    private location: Location,
    private quickbaseService: QuickbaseService
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras && nav.extras.state) {
      this.residentData = nav.extras.state['residentData'] || null;
      this.classRecord = nav.extras.state['classRecord'] || null;
    } else if (history && history.state) {
      this.residentData = history.state['residentData'] || null;
      this.classRecord = history.state['classRecord'] || null;
    }
    this.participantId = this.classRecord?.classId
      || this.classRecord?.['51']?.value
      || this.classRecord?.['51']
      || this.residentData?.recordNumber2?.value
      || this.residentData?.recordNumber2
      || this.residentData?.recordNumber
      || '';
  }

  async proceedToCurriculum() {
    this.curriculumError = '';
    this.isOpening = true;
    const recordId = this.classRecord?.classId;
    const fileName = this.classRecord?.curriculum?.fileName;
    console.log('[DIAG] proceedToCurriculum - recordId', recordId, 'fileName', fileName);
    if (!recordId) {
      this.curriculumError = 'Unable to locate the class record.';
      this.isOpening = false;
      return;
    }
    try {
      const result: any = await this.quickbaseService.getCurriculum(recordId, 161, fileName);
      console.log('[DIAG] proceedToCurriculum - getCurriculum result', result);
      const data = result?.data ?? result;
      if (!data?.success || !data?.base64) {
        this.curriculumError = data?.error || 'The curriculum file is not available.';
        this.isOpening = false;
        return;
      }
      const mimeType = data.contentType || 'application/pdf';
      const base64 = data.base64;
      const byteString = atob(base64);
      const byteArray = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000 * 60 * 5);
    } catch (e: any) {
      console.error('[DIAG] proceedToCurriculum - error', e);
      this.curriculumError = 'Unable to open the curriculum PDF.';
    } finally {
      this.isOpening = false;
    }
  }

  goBack() {
    this.location.back();
  }

  formatDate(fieldObj: any): string {
    if (!fieldObj) return '';
    const raw = fieldObj.value ?? fieldObj;
    if (!raw) return '';
    const s = String(raw).trim();
    const parts = s.split('-');
    if (parts.length === 3 &&
        parts[0].length === 4 &&
        parts[1].length === 2 &&
        parts[2].length === 2) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return `${m}/${d}/${y}`;
    }
    return s;
  }

  formatCurriculum(curriculum: any): string {
    if (!curriculum) return '';
    if (curriculum.fileName) return curriculum.fileName;
    if (curriculum.attachment?.fileName) return curriculum.attachment.fileName;
    if (curriculum.attachment?.name) return curriculum.attachment.name;
    return 'Curriculum';
  }
}
