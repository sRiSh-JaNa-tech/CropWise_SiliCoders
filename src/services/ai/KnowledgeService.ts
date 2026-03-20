// KnowledgeService.ts - Offline RAG Engine

export interface TreatmentInfo {
  id: string;
  crop: string;
  disease: string;
  symptoms: string[];
  organic_treatment: string;
  chemical_treatment: string;
  ag_code: string;
}

class KnowledgeService {
  private diseases: TreatmentInfo[] = [];
  private crops: any[] = [];

  async init() {
    try {
      const dResp = await fetch('/data/knowledge_base/diseases_treatments.json');
      this.diseases = await dResp.json();
      
      const cResp = await fetch('/data/knowledge_base/crops_info.json');
      this.crops = await cResp.json();
    } catch (error) {
      console.error("Offline Knowledge Base failed to load", error);
    }
  }

  async getTreatment(crop: string, disease: string): Promise<TreatmentInfo | null> {
    if (this.diseases.length === 0) await this.init();
    
    return this.diseases.find(d => 
      d.crop.toLowerCase() === crop.toLowerCase() && 
      d.disease.toLowerCase() === disease.toLowerCase()
    ) || null;
  }

  generateAgCode(info: { crop: string, disease: string, confidence: number }): string {
    const cropTag = info.crop.substring(0, 3).toUpperCase();
    const disTag = info.disease.replace(' ', '_').toUpperCase();
    const conf = Math.floor(info.confidence * 100);
    return `AGRI-CODE:${cropTag}-${disTag}-${conf}`;
  }
}

export const knowledgeService = new KnowledgeService();
