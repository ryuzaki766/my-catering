import { getRepository } from '../repositories/index.js';

export class OnboardingService {
  private get repo() {
    return getRepository();
  }

  async seedContohData(usahaId: string): Promise<void> {
    await this.repo.isiContohData(usahaId);
  }
}
