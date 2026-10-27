from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------- Dialect Region Schemas ----------------

class DialectRegionBase(BaseModel):
    code: str = Field(..., description="Unique machine identifier for region, e.g. hubballi_dharwad")
    name: str = Field(..., description="English name of dialect region")
    kannada_name: str = Field(..., description="Kannada script name")
    center_lat: float = Field(..., description="Latitude coordinate")
    center_lng: float = Field(..., description="Longitude coordinate")
    border_influences: List[str] = Field(default_factory=list, description="Neighboring languages influencing this dialect")
    prosody_profile: Dict[str, Any] = Field(default_factory=dict, description="Pitch, cadence, tempo, and inflection traits")
    cultural_notes: Optional[str] = Field(None, description="Ethno-linguistic context")


class DialectRegionCreate(DialectRegionBase):
    pass


class DialectRegionResponse(DialectRegionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------- Dialect Variant Schemas ----------------

class DialectVariantBase(BaseModel):
    local_script: str = Field(..., description="Local variant in Kannada script")
    local_phonetic: str = Field(..., description="Roman phonetic transcription of local pronunciation")
    ipa_pronunciation: str = Field(..., description="International Phonetic Alphabet transcription")
    morphological_rule: Optional[str] = Field(None, description="Linguistic mutation / morphological transformation tag")
    example_sentence_local: Optional[str] = Field(None, description="Usage sentence in local dialect")
    example_sentence_standard: Optional[str] = Field(None, description="Equivalent sentence in standard Kannada")
    cultural_origin_note: Optional[str] = Field(None, description="Substrate or historical context")
    confidence_score: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score of authentic field record")


class DialectVariantCreate(DialectVariantBase):
    lexical_entry_id: int
    region_id: int


class DialectVariantResponse(DialectVariantBase):
    id: int
    lexical_entry_id: int
    region_id: int

    model_config = ConfigDict(from_attributes=True)


class DialectVariantWithRegionResponse(DialectVariantResponse):
    region: Optional[DialectRegionResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------- Lexical Entry Schemas ----------------

class LexicalEntryBase(BaseModel):
    standard_kannada: str = Field(..., description="Canonical standard Kannada word or phrase")
    standard_roman: str = Field(..., description="Canonical Romanized Kannada transliteration")
    english_meaning: str = Field(..., description="English definition or gloss")
    category: str = Field(..., description="Semantic domain: greeting, food, question, emotion, daily, agrarian")
    grammatical_pos: str = Field(..., description="Part of speech: noun, verb, adverb, adjective, interjection, phrase")


class LexicalEntryCreate(LexicalEntryBase):
    pass


class LexicalEntryResponse(LexicalEntryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class LexicalEntryDetailResponse(LexicalEntryResponse):
    variants: List[DialectVariantWithRegionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ---------------- Health & Diagnostics ----------------

class HealthResponse(BaseModel):
    status: str
    database: str
    app_name: str
    region_count: int
    lexicon_count: int
    variant_count: int

