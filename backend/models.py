from typing import Any, Dict, List, Optional
from sqlalchemy import Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class DialectRegion(Base):
    __tablename__ = "dialect_regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    kannada_name: Mapped[str] = mapped_column(String(128), nullable=False)
    center_lat: Mapped[float] = mapped_column(Float, nullable=False)
    center_lng: Mapped[float] = mapped_column(Float, nullable=False)
    border_influences: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    prosody_profile: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    cultural_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    variants: Mapped[List["DialectVariant"]] = relationship(
        "DialectVariant",
        back_populates="region",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class LexicalEntry(Base):
    __tablename__ = "lexical_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    standard_kannada: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    standard_roman: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    english_meaning: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    grammatical_pos: Mapped[str] = mapped_column(String(64), nullable=False)

    # Relationships
    variants: Mapped[List["DialectVariant"]] = relationship(
        "DialectVariant",
        back_populates="lexical_entry",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class DialectVariant(Base):
    __tablename__ = "dialect_variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lexical_entry_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("lexical_entries.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    region_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("dialect_regions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    local_script: Mapped[str] = mapped_column(String(255), nullable=False)
    local_phonetic: Mapped[str] = mapped_column(String(255), nullable=False)
    ipa_pronunciation: Mapped[str] = mapped_column(String(255), nullable=False)
    morphological_rule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    example_sentence_local: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    example_sentence_standard: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cultural_origin_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Relationships
    lexical_entry: Mapped["LexicalEntry"] = relationship(
        "LexicalEntry",
        back_populates="variants",
        lazy="selectin",
    )
    region: Mapped["DialectRegion"] = relationship(
        "DialectRegion",
        back_populates="variants",
        lazy="selectin",
    )

