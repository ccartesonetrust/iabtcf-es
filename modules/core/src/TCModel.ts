import {Vector} from './Vector';
import {VectorPath} from './VectorPath';
import {PurposeRestriction} from './PurposeRestriction';
import {GVL} from './GVL';
import {TCModelError} from './errors/TCModelError';

class TCModel {

  public static MAX_ENCODING_VERSION: number = 2;
  private version_: number;
  private cmpId_: number;
  private cmpVersion_: number;
  private created_: Date;
  private lastUpdated_: Date;
  private consentScreen_: number;
  private consentLanguage_: string;
  private vendorListVersion_: number;
  private gvl_: GVL;
  private policyVersion_: number;

  /**
   * Whether the signals encoded in this TC String were from site-specific
   * storage (True) versus ‘global’ consensu.org shared storage (False). A
   * string intended to be stored in global/shared scope but the CMP is unable
   * to store due to a user agent not accepting third-party cookies would be
   * considered site-specific (True).
   */
  public isServiceSpecific: boolean = false;

  /**
   * Non-standard stacks means that a CMP is using publisher-customized stack
   * descriptions. Stacks (in terms of purposes in a stack) are pre-set by the
   * IAB. As are titles. Descriptions are pre-set, but publishers can customize
   * them. If they do, they need to set this bit to indicate that they've
   * customized descriptions.
   */
  public useNonStandardStacks: boolean = false;

  /**
   * The TCF designates certain Features as special, that is, a CMP must afford
   * the user a means to opt in to their use. These Special Features are
   * published and numbered in the GVL separately from normal Features.
   * Provides for up to 12 special features.
   */
  public specialFeatureOptIns: Vector<boolean> = new Vector<boolean>();

  /**
   * Renamed from `PurposesAllowed` in TCF v1.1
   * The user’s consent value for each Purpose established on the legal basis
   * of consent. Purposes are published in the Global Vendor List (see. [[GVL]]).
   */
  public purposeConsents: Vector<boolean>;

  /**
   * The user’s permission for each Purpose established on the legal basis of
   * legitimate interest. If the user has exercised right-to-object for a
   * purpose, the corresponding bit for that purpose should be set to false.
   */
  public purposeLITransparency: Vector<boolean>;

  /**
   * Each [[Vendor]] is keyed by id. Their consent value is stored as boolean.
   *
   * ```javascript
   * // to set
   * tcModel.vendorConsents.set(2222, true);
   *
   * // to get
   * const hasConsent = tcModel.vendorConsents.get(2222);
   * ```
   */
  public vendorConsents: Vector<boolean>;

  /**
   * Each [[Vendor]] is keyed by id. Whether their Legitimate Interest
   * Disclosures have been established is stored as boolean.
   *
   * ```javascript
   * // to set
   * tcModel.vendorLegitimateInterest.set(2222, true);
   *
   * // to get
   * const hasConsent = tcModel.vendorLegitimateInterest.get(2222);
   * ```
   */
  public vendorLegitimateInterest: Vector<boolean>;

  /**
   * Each [[Vendor]] is keyed by id. The value stored is a
   * [[PurposeRestriction]] object.
   *
   * ```javascript
   * // to set
   * const purposeRestriction = new PurposeRestriction();
   * tcModel.vendorLegitimateInterest.set(2222, true);
   *
   * // to get
   * const hasConsent = tcModel.vendorLegitimateInterest.get(2222);
   * ```
   */
  public publisherRestrictions: Vector<PurposeRestriction>;

  /**
   * Constructs the TCModel. Passing a [[GVL]] is optional when constructing
   * as this TCModel may be constructed from decoding an existing encoded
   * TCString.
   *
   * @param {GVL} [gvl]
   */
  public constructor(gvl?: GVL) {

    if (gvl) {

      this.gvl = gvl;

    }
    this.created = new Date();

  }

  /**
   * sets the [[GVL]] with side effects of also setting the `vendorListVersion` and `policyVersion`
   * @param {GVL} gvl - may only be set once for this model.
   * @throws {TCModelError} if a gvl is already set on this TCModel
   */
  public set gvl(gvl: GVL) {

    if (this.gvl_ === undefined) {

      this.gvl_ = gvl;
      this.vendorListVersion_ = gvl.vendorListVersion;
      this.policyVersion_ = gvl.tcfPolicyVersion;

      this.specialFeatureOptIns = new Vector<boolean>(gvl, VectorPath.SPECIAL_FEATURE, false);
      this.purposeConsents = new Vector<boolean>(gvl, VectorPath.PURPOSE, false);
      this.purposeLITransparency = new Vector<boolean>(gvl, VectorPath.PURPOSE, false);
      this.vendorConsents = new Vector<boolean>(gvl, VectorPath.VENDOR, false);
      this.vendorLegitimateInterest = new Vector<boolean>(gvl, VectorPath.VENDOR, false);

    } else {

      throw new TCModelError('gvl', gvl, 'can be set only once');

    }

  }

  /**
   * @return {GVL} the gvl instance set on this TCModel instance
   */
  public get gvl(): GVL {

    return this.gvl_;

  }

  /**
   * sets encoded created date.  Will auto convert to deciseconds as the encoding requires
   *
   * @param {Date} date - in case the created date is different than when this
   * TCModel was constructed.  This is auto set for the encoding when this
   * object is created.
   */
  public set created(date: Date) {

    this.created_ = new Date(Math.round(date.getTime()/100));

  }

  /**
   * @return {Date} - date this TCModel was created and/or the string that this
   * TCModel was decoded from.
   */
  public get created(): Date {

    return this.created_;

  }

  /**
   * sets encoded last updated date.  Will auto convert to deciseconds as the encoding requires
   *
   * @param {Date} date - this is automatically updated on encoding
   * */
  public set lastUpdated(date: Date) {

    this.lastUpdated_ = new Date(Math.round(date.getTime()/100));

  }

  /**
   * @return {Date} - date this TCModel was last updated  and/or the string
   * that this TCModel was decoded from.
   */
  public get lastUpdated(): Date {

    return this.lastUpdated_;

  }

  /**
   * @param {number} integer - A unique ID will be assigned to each Consent
   * Manager Provider (CMP) from the iab.
   *
   * @throws {TCModelError} if the id is not an integer greater than 1 as those are not valid.
   */
  public set cmpId(integer: number) {

    if (this.isIntAbove(integer, 1)) {


      this.cmpId_ = integer;

    } else {

      throw new TCModelError('cmpId', integer);

    }

  }

  /**
   * @return {number} - A unique ID will be assigned to each Consent Manager
   * Provider (CMP) from the iab.
   */
  public get cmpId(): number {

    return this.cmpId_;

  }
  /**
   * @param {number} integer - Each change to an operating CMP should receive a
   * new version number, for logging proof of consent. CmpVersion defined by
   * each CMP.
   */
  public set cmpVersion(integer: number) {

    if (this.isIntAbove(integer, -1)) {

      this.cmpVersion_ = integer;

    } else {

      throw new TCModelError('cmpVersion', integer);

    }

  }

  /**
   * @return {number} - Each change to an operating CMP should receive a new
   * version number, for logging proof of consent. CmpVersion defined by each
   * CMP.
   */
  public get cmpVersion(): number {

    return this.cmpVersion_;

  }

  /**
   * @param {number} integer - Each change to an operating CMP should receive a
   * new version number, for logging proof of consent. CmpVersion defined by
   * each CMP.
   * @return {undefined}
   */
  public set consentScreen(integer: number) {

    if (this.isIntAbove(integer, -1)) {

      this.consentScreen_ = integer;

    } else {

      throw new TCModelError('consentScreen', integer);

    }

  }

  /**
   * @return {number} - Each change to an operating CMP should receive a new
   * version number, for logging proof of consent. CmpVersion defined by each
   * CMP.
   */
  public get consentScreen(): number {

    return this.consentScreen_;

  }

  /**
   * @param {string} lang - lowercase [two-letter ISO 639-1 language
   * code](http://www.loc.gov/standards/iso639-2/php/code_list.php) in which
   * the CMP UI was presented
   * @return {undefined}
   */
  public set consentLanguage(lang: string) {

    // lowercase a is 97
    const ASCII_START = 96;
    const ALPHABET_CARDINALITY = 26;

    // for error messages if needed
    const fieldName = 'consentLanguage';

    if (lang.length === 2) {

      const firstLetter: number = lang.charCodeAt(0) - ASCII_START;
      const secondLetter: number = lang.charCodeAt(1) - ASCII_START;

      if (firstLetter > 0
          && secondLetter > 0
          && firstLetter <= ALPHABET_CARDINALITY
          && secondLetter <= ALPHABET_CARDINALITY) {

        this.consentLanguage_ = lang;

      } else {

        throw new TCModelError(fieldName, lang);

      }

    } else {

      throw new TCModelError(fieldName, lang);

    }

  }
  /**
   * @return {string} - lowercase [two-letter ISO 639-1 language
   * code](http://www.loc.gov/standards/iso639-2/php/code_list.php) in which
   * the CMP UI was presented
   */
  public get consentLanguage(): string {

    return this.consentLanguage_;

  }

  /**
   * @return {number} - the global vendor list version this TCModel is
   * constructed with
   */
  public get vendorListVersion(): number {

    return this.vendorListVersion_;

  }

  /**
   * @return {number} - the policyVersion this TCModel is constructed with
   */
  public get policyVersion(): number {

    return this.policyVersion_;

  }

  /**
   * @param {number} num - indicates what version a TCString should be encoded as
   */
  public set version(num: number) {

    if (Number.isInteger(num) && num <= TCModel.MAX_ENCODING_VERSION && num > 0) {

      this.version_ = num;

    } else {

      throw new TCModelError('version', num, `max version is ${TCModel.MAX_ENCODING_VERSION}, can't be higher`);

    }

  }

  /**
   * @return {number} - Incremented when TC String format changes. Indicates
   * what encoding format the TCString will follow v1 or v2.  v1 fields will
   * omit fields.
   */
  public get version(): number {

    return this.version_;

  }
  /**
   * isIntAbove - private method for validating that a passed in value is both
   * an int and above a certain number
   *
   * @param {number} possibleInt - value to check
   * @param {number} above - the lower limit
   * @return{boolean} - wehther or not `possibleInt` is both an int and above `above` number
   */
  private isIntAbove(possibleInt: number, above: number): boolean {

    return (Number.isInteger(possibleInt) && possibleInt > above);

  }


}

export {TCModel};