$.params = arguments[0] || {};

$.background.opacity = $.params.opacity;
if ($.params.drug) $.drug.text = $.params.drug;
if ($.params.dosage) $.interval.text = $.params.dosage;