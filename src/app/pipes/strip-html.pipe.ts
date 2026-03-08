import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripHtml'
})
export class StripHtmlPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '0';
    
    // If it's already a number, return it as string
    if (typeof value === 'number') {
      return value.toString();
    }
    
    // If it's a string that might contain HTML, strip the HTML tags
    if (typeof value === 'string') {
      // Create a temporary div element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = value;
      
      // Extract just the text content
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // If it's a number after stripping HTML, return it
      const numericValue = parseFloat(textContent.trim());
      if (!isNaN(numericValue)) {
        return numericValue.toString();
      }
      
      // Otherwise return the text content
      return textContent.trim() || '0';
    }
    
    return '0';
  }
}