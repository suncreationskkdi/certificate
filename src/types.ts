export interface TemplateField {
  id: string;
  fieldName: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface Template {
  id: string;
  name: string;
  backgroundUrl: string;
  width: number;
  height: number;
  fields: TemplateField[];
}

export interface CertificateData {
  [key: string]: string;
}
