#!/usr/bin/env python3
"""
Purpose: Multi-language linting rules package initialization
Scope: Exports multi-language rules that work across programming languages
Overview: This package contains linting rules that work across multiple programming
    languages by using the language-agnostic base interfaces. These rules demonstrate
    how to write rules that can analyze code regardless of the programming language,
    enabling consistent enforcement of design principles across polyglot codebases.
    The rules use file-based analysis and language-neutral approaches to check for
    common issues like line length, file organization, and other structural concerns
    that apply universally to source code files.
Dependencies: tools.design_linters.framework for base interfaces
Exports: Multi-language rule classes
Interfaces: All rules inherit from FileBasedMultiLanguageRule or MultiLanguageRule
Implementation: Language-agnostic rule implementations
"""

from .line_length_rules import ExcessiveLineLengthRule, LineLengthRule

__all__ = [
    "LineLengthRule",
    "ExcessiveLineLengthRule",
]
