package com.spendlens.backend.imports;

public class ParseTextImportRequest {

    private String text;

    public ParseTextImportRequest() {
    }

    public ParseTextImportRequest(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}