import { Injectable, Logger } from '@nestjs/common';

/**
 * Provincias de Argentina
 */
export enum Province {
  BUENOS_AIRES = 'BA',
  CABA = 'CABA',
  CATAMARCA = 'CT',
  CHACO = 'CC',
  CHUBUT = 'CH',
  CORDOBA = 'CB',
  CORRIENTES = 'CR',
  ENTRE_RIOS = 'ER',
  FORMOSA = 'FO',
  JUJUY = 'JY',
  LA_PAMPA = 'LP',
  LA_RIOJA = 'LR',
  MENDOZA = 'MZ',
  MISIONES = 'MI',
  NEUQUEN = 'NQ',
  RIO_NEGRO = 'RN',
  SALTA = 'SA',
  SAN_JUAN = 'SJ',
  SAN_LUIS = 'SL',
  SANTA_CRUZ = 'SC',
  SANTA_FE = 'SF',
  SANTIAGO_DEL_ESTERO = 'SE',
  TIERRA_DEL_FUEGO = 'TF',
  TUCUMAN = 'TU',
}

/**
 * Tasas de Ingresos Brutos por provincia (2024)
 * Estas tasas varían según la actividad y provincia
 * Valores aproximados para comercio general
 *
 * IMPORTANTE: Estas tasas son referenciales y deben actualizarse
 * según la normativa vigente de cada provincia
 */
export const IIBB_RATES: Record<Province, number> = {
  [Province.BUENOS_AIRES]: 0.035, // 3.5%
  [Province.CABA]: 0.03, // 3%
  [Province.CATAMARCA]: 0.04, // 4%
  [Province.CHACO]: 0.04, // 4%
  [Province.CHUBUT]: 0.035, // 3.5%
  [Province.CORDOBA]: 0.035, // 3.5%
  [Province.CORRIENTES]: 0.04, // 4%
  [Province.ENTRE_RIOS]: 0.04, // 4%
  [Province.FORMOSA]: 0.04, // 4%
  [Province.JUJUY]: 0.04, // 4%
  [Province.LA_PAMPA]: 0.04, // 4%
  [Province.LA_RIOJA]: 0.04, // 4%
  [Province.MENDOZA]: 0.035, // 3.5%
  [Province.MISIONES]: 0.04, // 4%
  [Province.NEUQUEN]: 0.04, // 4%
  [Province.RIO_NEGRO]: 0.04, // 4%
  [Province.SALTA]: 0.04, // 4%
  [Province.SAN_JUAN]: 0.04, // 4%
  [Province.SAN_LUIS]: 0.04, // 4%
  [Province.SANTA_CRUZ]: 0.04, // 4%
  [Province.SANTA_FE]: 0.035, // 3.5%
  [Province.SANTIAGO_DEL_ESTERO]: 0.04, // 4%
  [Province.TIERRA_DEL_FUEGO]: 0.035, // 3.5%
  [Province.TUCUMAN]: 0.04, // 4%
};

/**
 * Actividades económicas para IIBB
 * Las tasas varían según la actividad
 */
export enum IIBBActivity {
  COMERCIO_MINORISTA = 'COMERCIO_MINORISTA',
  COMERCIO_MAYORISTA = 'COMERCIO_MAYORISTA',
  SERVICIOS_PROFESIONALES = 'SERVICIOS_PROFESIONALES',
  SERVICIOS_TECNOLOGIA = 'SERVICIOS_TECNOLOGIA',
  CONSTRUCCION = 'CONSTRUCCION',
  INDUSTRIA = 'INDUSTRIA',
  AGROPECUARIO = 'AGROPECUARIO',
}

/**
 * Tasas de IIBB por actividad y provincia (CABA)
 * Ejemplo para Ciudad Autónoma de Buenos Aires
 */
export const IIBB_ACTIVITY_RATES_CABA: Record<IIBBActivity, number> = {
  [IIBBActivity.COMERCIO_MINORISTA]: 0.03, // 3%
  [IIBBActivity.COMERCIO_MAYORISTA]: 0.025, // 2.5%
  [IIBBActivity.SERVICIOS_PROFESIONALES]: 0.035, // 3.5%
  [IIBBActivity.SERVICIOS_TECNOLOGIA]: 0.03, // 3%
  [IIBBActivity.CONSTRUCCION]: 0.03, // 3%
  [IIBBActivity.INDUSTRIA]: 0.025, // 2.5%
  [IIBBActivity.AGROPECUARIO]: 0.02, // 2%
};

@Injectable()
export class IIBBService {
  private readonly logger = new Logger(IIBBService.name);

  /**
   * Calcula Ingresos Brutos según provincia
   * @param amountCents Monto en centavos
   * @param province Provincia
   * @returns Impuesto en centavos
   */
  calculateIIBB(amountCents: number, province: Province): number {
    const rate = this.getRate(province);
    const iibbCents = Math.round(amountCents * rate);

    this.logger.debug(
      `IIBB calculation: ${amountCents} cents * ${rate} = ${iibbCents} cents (${province})`
    );

    return iibbCents;
  }

  /**
   * Calcula IIBB según provincia y actividad
   * @param amountCents Monto en centavos
   * @param province Provincia
   * @param activity Actividad económica
   * @returns Impuesto en centavos
   */
  calculateIIBBByActivity(
    amountCents: number,
    province: Province,
    activity: IIBBActivity
  ): number {
    // Por ahora solo implementamos CABA con actividades
    // Otras provincias pueden agregarse según necesidad
    let rate: number;

    if (province === Province.CABA) {
      rate = IIBB_ACTIVITY_RATES_CABA[activity];
    } else {
      // Usar tasa general de la provincia
      rate = this.getRate(province);
    }

    const iibbCents = Math.round(amountCents * rate);

    this.logger.debug(
      `IIBB calculation by activity: ${amountCents} cents * ${rate} = ${iibbCents} cents (${province}, ${activity})`
    );

    return iibbCents;
  }

  /**
   * Obtiene la tasa de IIBB para una provincia
   * @param province Provincia
   * @returns Tasa decimal (ej: 0.03 para 3%)
   */
  getRate(province: Province): number {
    return IIBB_RATES[province] || 0;
  }

  /**
   * Obtiene la tasa de IIBB como porcentaje
   * @param province Provincia
   * @returns Tasa en porcentaje (ej: 3.0 para 3%)
   */
  getRatePercentage(province: Province): number {
    return this.getRate(province) * 100;
  }

  /**
   * Calcula el monto neto después de IIBB
   * @param amountCents Monto bruto en centavos
   * @param province Provincia
   * @returns Monto neto en centavos
   */
  calculateNetAmount(amountCents: number, province: Province): number {
    const iibb = this.calculateIIBB(amountCents, province);
    return amountCents - iibb;
  }

  /**
   * Determina si un contribuyente debe pagar IIBB según su condición
   * @param fiscalCondition Condición fiscal (RI, MONO, etc)
   * @param annualIncome Ingreso anual estimado en pesos
   * @returns true si debe pagar IIBB
   */
  shouldPayIIBB(fiscalCondition: string, annualIncome: number): boolean {
    // Responsables Inscriptos generalmente pagan IIBB
    if (fiscalCondition === 'RI') {
      return true;
    }

    // Monotributistas en categorías altas pueden estar obligados
    // según cada provincia (esto es simplificado)
    if (fiscalCondition === 'MONO') {
      // Ejemplo: si supera cierto umbral anual
      // Estos valores varían por provincia
      return annualIncome > 10000000; // $10M anuales
    }

    return false;
  }

  /**
   * Obtiene todas las provincias con sus tasas
   * @returns Array de provincias con tasas
   */
  getAllRates(): Array<{ province: Province; rate: number; percentage: number }> {
    return Object.values(Province).map((province) => ({
      province,
      rate: this.getRate(province),
      percentage: this.getRatePercentage(province),
    }));
  }

  /**
   * Calcula IIBB para múltiples provincias (convenio multilateral)
   * Útil para empresas que operan en varias provincias
   *
   * @param amountCents Monto total en centavos
   * @param distribution Distribución de ingresos por provincia
   * @returns IIBB total y por provincia
   */
  calculateMultilateralIIBB(
    amountCents: number,
    distribution: Array<{ province: Province; percentage: number }>
  ): {
    total: number;
    byProvince: Array<{ province: Province; amount: number; iibb: number }>;
  } {
    // Validar que los porcentajes sumen 100%
    const totalPercentage = distribution.reduce((sum, d) => sum + d.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(
        `Distribution percentages must sum 100%, got ${totalPercentage}`
      );
    }

    let totalIIBB = 0;
    const byProvince = distribution.map((dist) => {
      const provinceAmount = Math.round((amountCents * dist.percentage) / 100);
      const provinceIIBB = this.calculateIIBB(provinceAmount, dist.province);
      totalIIBB += provinceIIBB;

      return {
        province: dist.province,
        amount: provinceAmount,
        iibb: provinceIIBB,
      };
    });

    return {
      total: totalIIBB,
      byProvince,
    };
  }
}
