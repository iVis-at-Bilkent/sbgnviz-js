/*
 * Common utilities for elements includes both general utilities and sbgn specific utilities
 */

var libUtilities = require('./lib-utilities');
var textUtilities = require('./text-utilities');
var truncateText = textUtilities.truncateText;
var libs = libUtilities.getLibs();
var jQuery = $ = libs.jQuery;

module.exports = function () {
  var optionUtilities, graphUtilities;
  var options;
  var cy;

  function elementUtilities (param) {
    // Init params to be accessed by elementUtilities
    optionUtilities = param.optionUtilities;
    options = optionUtilities.getOptions();
    graphUtilities = param.graphUtilities;
    cy = param.sbgnCyInstance.getCy();
  }

  var inArray = function( value, arr ) {
    return $.inArray( value, arr ) !== -1;
  };

  // initialize map type
  elementUtilities.mapType = undefined;
  elementUtilities.fileFormat = undefined;

  elementUtilities.PD = {}; // namespace for all PD specific stuff
  elementUtilities.AF = {}; // namespace for all AF specific stuff
  elementUtilities.SIF = {}; // namespace for all SIF specific stuff


  /*
    see http://journal.imbio.de/articles/pdf/jib-263.pdf p.41 <-- but beware, outdated
    following tables have been updated with PD lvl1 v2.0 of November 7, 2016 working draft
    only the following things have been changed from 2.0 (this version is not clear on connectivity):
     - empty set has no limit on its edge count
     - logic operators can be source and target
     - limit of 1 catalysis and 1 necessary stimulation on a process

    for each edge class and nodeclass define 2 cases:
     - node can be a source of this edge -> asSource
     - node can be a target of this edge -> asTarget
    for both cases, tells if it is allowed and what is the limit of edges allowed.
    Limits can concern only this type of edge (maxEdge) or the total number of edges for this node (maxTotal).
    Consider undefined things as false/unallowed -> whitelist behavior.

    the nodes/edges class listed below are those used in the program.
    For instance "compartment" isn't a node in SBGN specs.
  */
  elementUtilities.PD.connectivityConstraints = {
    "consumption": {
      "macromolecule":        {asSource: {isAllowed: true},    asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},    asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},    asTarget: {}},
      "complex":              {asSource: {isAllowed: true},    asTarget: {}},
      "nucleic acid feature": {asSource: {isAllowed: true},    asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {isAllowed: true},    asTarget: {}},
      "perturbing agent":     {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {},   asTarget: {isAllowed: true}},
      "omitted process":      {asSource: {},   asTarget: {isAllowed: true}},
      "uncertain process":    {asSource: {},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {}},
      "association":          {asSource: {},   asTarget: {isAllowed: true}},
      "dissociation":         {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1, maxTotal: 1}},
      "and":                  {asSource: {},   asTarget: {}},
      "or":                   {asSource: {},   asTarget: {}},
      "not":                  {asSource: {},   asTarget: {}}
    },
    "production": {
      "macromolecule":        {asSource: {},   asTarget: {isAllowed: true}},
      "simple chemical":      {asSource: {},   asTarget: {isAllowed: true}},
      "unspecified entity":   {asSource: {},   asTarget: {isAllowed: true}},
      "complex":              {asSource: {},   asTarget: {isAllowed: true}},
      "nucleic acid feature": {asSource: {},   asTarget: {isAllowed: true}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {},   asTarget: {isAllowed: true}},
      "perturbing agent":     {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {isAllowed: true},    asTarget: {}},
      "omitted process":      {asSource: {isAllowed: true},    asTarget: {}},
      "uncertain process":    {asSource: {isAllowed: true},    asTarget: {}},
      "phenotype":            {asSource: {},   asTarget: {}},
      "association":          {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "dissociation":         {asSource: {isAllowed: true},    asTarget: {}},
      "and":                  {asSource: {},   asTarget: {}},
      "or":                   {asSource: {},   asTarget: {}},
      "not":                  {asSource: {},   asTarget: {}}
    },
    "modulation": {
      "macromolecule":        {asSource: {isAllowed: true},    asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},    asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},    asTarget: {}},
      "complex":              {asSource: {isAllowed: true},    asTarget: {}},
      "nucleic acid feature": {asSource: {isAllowed: true},    asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {isAllowed: true},    asTarget: {}},
      "perturbing agent":     {asSource: {isAllowed: true},    asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {},   asTarget: {isAllowed: true}},
      "omitted process":      {asSource: {},   asTarget: {isAllowed: true}},
      "uncertain process":    {asSource: {},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true}},
      "association":          {asSource: {},   asTarget: {}},
      "dissociation":         {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}}
    },
    "stimulation": {
      "macromolecule":        {asSource: {isAllowed: true},    asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},    asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},    asTarget: {}},
      "complex":              {asSource: {isAllowed: true},    asTarget: {}},
      "nucleic acid feature": {asSource: {isAllowed: true},    asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {isAllowed: true},    asTarget: {}},
      "perturbing agent":     {asSource: {isAllowed: true},    asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {},   asTarget: {isAllowed: true}},
      "omitted process":      {asSource: {},   asTarget: {isAllowed: true}},
      "uncertain process":    {asSource: {},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true}},
      "association":          {asSource: {},   asTarget: {}},
      "dissociation":         {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}}
    },
    "catalysis": {
      "macromolecule":        {asSource: {isAllowed: true},    asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},    asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},    asTarget: {}},
      "complex":              {asSource: {isAllowed: true},    asTarget: {}},
      "nucleic acid feature": {asSource: {},   asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {isAllowed: true},    asTarget: {}},
      "perturbing agent":     {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "omitted process":      {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "uncertain process":    {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "association":          {asSource: {},   asTarget: {}},
      "dissociation":         {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}}
    },
    "inhibition": {
      "macromolecule":        {asSource: {isAllowed: true},    asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},    asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},    asTarget: {}},
      "complex":              {asSource: {isAllowed: true},    asTarget: {}},
      "nucleic acid feature": {asSource: {isAllowed: true},    asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {isAllowed: true},    asTarget: {}},
      "perturbing agent":     {asSource: {isAllowed: true},    asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {},   asTarget: {isAllowed: true}},
      "omitted process":      {asSource: {},   asTarget: {isAllowed: true}},
      "uncertain process":    {asSource: {},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true}},
      "association":          {asSource: {},   asTarget: {}},
      "dissociation":         {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}}
    },
    "necessary stimulation": {
      "macromolecule":        {asSource: {isAllowed: true},    asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},    asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},    asTarget: {}},
      "complex":              {asSource: {isAllowed: true},    asTarget: {}},
      "nucleic acid feature": {asSource: {isAllowed: true},    asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {isAllowed: true},    asTarget: {}},
      "perturbing agent":     {asSource: {isAllowed: true},    asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "omitted process":      {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "uncertain process":    {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1}},
      "association":          {asSource: {},   asTarget: {}},
      "dissociation":         {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {}},
    },
    "logic arc": {
      "macromolecule":        {asSource: {isAllowed: true},    asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},    asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},    asTarget: {}},
      "complex":              {asSource: {isAllowed: true},    asTarget: {}},
      "nucleic acid feature": {asSource: {isAllowed: true},    asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "source and sink":      {asSource: {isAllowed: true},    asTarget: {}},
      "perturbing agent":     {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "process":              {asSource: {},   asTarget: {}},
      "omitted process":      {asSource: {},   asTarget: {}},
      "uncertain process":    {asSource: {},   asTarget: {}},
      "phenotype":            {asSource: {},   asTarget: {}},
      "association":          {asSource: {},   asTarget: {}},
      "dissociation":         {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {isAllowed: true}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {isAllowed: true}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},      asTarget: {isAllowed: true, maxEdge: 1, maxTotal: 1}},
    },
    "equivalence arc": {
      "macromolecule":        {asSource: {isAllowed: true},   asTarget: {}},
      "simple chemical":      {asSource: {isAllowed: true},   asTarget: {}},
      "unspecified entity":   {asSource: {isAllowed: true},   asTarget: {}},
      "complex":              {asSource: {isAllowed: true},   asTarget: {}},
      "nucleic acid feature": {asSource: {isAllowed: true},   asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {isAllowed: true}},
      "source and sink":      {asSource: {},   asTarget: {}},
      "perturbing agent":     {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {isAllowed: true}},
      "process":              {asSource: {},   asTarget: {}},
      "omitted process":      {asSource: {},   asTarget: {}},
      "uncertain process":    {asSource: {},   asTarget: {}},
      "phenotype":            {asSource: {},   asTarget: {}},
      "association":          {asSource: {},   asTarget: {}},
      "dissociation":         {asSource: {},   asTarget: {}},
      "and":                  {asSource: {},   asTarget: {}},
      "or":                   {asSource: {},   asTarget: {}},
      "not":                  {asSource: {},   asTarget: {}}
    }
  };

  /* AF node connectivity rules
   * See: Systems Biology Graphical Notation: Activity Flow language Level 1, Version 1.2, Date: July 27, 2015
   *   Section 3.3.1: Activity Nodes connectivity definition
   *   URL: https://doi.org/10.2390/biecoll-jib-2015-265
   */
  elementUtilities.AF.connectivityConstraints = {
    "positive influence": {
      "biological activity":  {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true}},
      "tag":                  {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "delay":                {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
    },
    "negative influence": {
      "biological activity":  {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true}},
      "tag":                  {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "delay":                {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
    },
    "unknown influence": {
      "biological activity":  {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true}},
      "tag":                  {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "delay":                {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
    },
    "necessary stimulation": {
      "biological activity":  {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "phenotype":            {asSource: {},   asTarget: {isAllowed: true}},
      "tag":                  {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "and":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "or":                   {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "not":                  {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "delay":                {asSource: {isAllowed: true, maxEdge: 1, maxTotal: 1},   asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
    },
    "logic arc": {
      "biological activity":  {asSource: {isAllowed: true},   asTarget: {}},
      "phenotype":            {asSource: {},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {}},
      "submap":               {asSource: {},   asTarget: {}},
      "and":                  {asSource: {},   asTarget: {isAllowed: true}},
      "or":                   {asSource: {},   asTarget: {isAllowed: true}},
      "not":                  {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1, maxTotal: 1}},
      "delay":                {asSource: {},   asTarget: {isAllowed: true, maxEdge: 1, maxTotal: 1}},
      "compartment":          {asSource: {},   asTarget: {}},
    },
    "equivalence arc": {
      "biological activity":  {asSource: {isAllowed: true},   asTarget: {}},
      "phenotype":            {asSource: {isAllowed: true},   asTarget: {}},
      "tag":                  {asSource: {},   asTarget: {isAllowed: true}},
      "submap":               {asSource: {},   asTarget: {isAllowed: true}},
      "and":                  {asSource: {},   asTarget: {}},
      "or":                   {asSource: {},   asTarget: {}},
      "not":                  {asSource: {},   asTarget: {}},
      "delay":                {asSource: {},   asTarget: {}},
      "compartment":          {asSource: {},   asTarget: {}},
    },
  }

  elementUtilities.SIF.connectivityConstraints = {
    "controls-state-change-of": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "controls-transport-of": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "controls-phosphorylation-of": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "controls-expression-of": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "catalysis-precedes": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "in-complex-with": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "interacts-with": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "neighbor-of": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "consumption-controled-by": {
      "protein": {asSource: {},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {isAllowed: true},   asTarget: {}}
    },
    "controls-production-of": {
      "protein": {asSource: {isAllowed: true},   asTarget: {}},
      "small molecule": {asSource: {},   asTarget: {isAllowed: true}}
    },
    "controls-transport-of-chemical": {
      "protein": {asSource: {isAllowed: true},   asTarget: {}},
      "small molecule": {asSource: {},   asTarget: {isAllowed: true}}
    },
    "chemical-affects": {
      "protein": {asSource: {},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {isAllowed: true},   asTarget: {}}
    },
    "reacts-with": {
      "protein": {asSource: {},   asTarget: {}},
      "small molecule": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}}
    },
    "used-to-produce": {
      "protein": {asSource: {},   asTarget: {}},
      "small molecule": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}}
    },
    "activates": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "inhibits": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "phosphorylates": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "dephosphorylates": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "upregulates-expression": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
    "downregulates-expression": {
      "protein": {asSource: {isAllowed: true},   asTarget: {isAllowed: true}},
      "small molecule": {asSource: {},   asTarget: {}}
    },
  };

  elementUtilities.logicalOperatorTypes = ['and', 'or', 'not', 'delay'];
  elementUtilities.processTypes = ['process', 'omitted process', 'uncertain process',
    'association', 'dissociation', 'phenotype'];
  elementUtilities.biologicalActivityTypes = ['biological activity', 'BA plain', 'BA unspecified entity',
    'BA simple chemical', 'BA macromolecule', 'BA nucleic acid feature',
    'BA perturbing agent', 'BA complex'];
  elementUtilities.epnTypes = ['macromolecule', 'nucleic acid feature', 'simple chemical',
    'source and sink', 'unspecified entity',
    'perturbing agent', 'complex'];
  elementUtilities.sifTypes = ['protein', 'small molecule'];
  elementUtilities.otherNodeTypes = ['compartment', 'tag', 'submap'];

  elementUtilities.nodeTypes = elementUtilities.epnTypes
    .concat( elementUtilities.logicalOperatorTypes )
    .concat( elementUtilities.processTypes )
    .concat( elementUtilities.biologicalActivityTypes )
    .concat( elementUtilities.sifTypes )
    .concat( elementUtilities.otherNodeTypes );

  elementUtilities.compoundNodeTypes = ['complex', 'compartment', 'submap'];

  elementUtilities.simpleNodeTypes = $(elementUtilities.nodeTypes)
    .not(elementUtilities.compoundNodeTypes).get();

  elementUtilities.edgeTypes = ['consumption', 'production', 'modulation',
    'stimulation', 'catalysis', 'inhibition', 'necessary stimulation',
    'logic arc', 'equivalence arc', 'unknown influence', 'positive influence',
    'negative influence', 'controls-state-change-of',
    'controls-transport-of', 'controls-phosphorylation-of',
    'controls-expression-of', 'catalysis-precedes', 'in-complex-with',
    'interacts-with', 'neighbor-of', 'consumption-controled-by',
    'controls-production-of', 'controls-transport-of-chemical',
    'chemical-affects', 'reacts-with', 'used-to-produce',
    'activates', 'inhibits', 'phosphorylates', 'dephosphorylates',
    'upregulates-expression', 'downregulates-expression'
  ];

  elementUtilities.elementTypes = elementUtilities.nodeTypes
    .concat( elementUtilities.edgeTypes );

  /*
  * Get sbgnclass of the given element. If the parameter is a string return it
  * by assuming that it is the sbgnclass itself.
  */
  elementUtilities.getSbgnClass = function( ele ) {
    if ( ele == null ) {
      return null;
    }

    var sbgnclass = typeof ele === 'string' ? ele : ele.data('class');

    return sbgnclass;
  };

  /*
  * Get sbgn class omitting the multimer information
  */
  elementUtilities.getPureSbgnClass = function( ele ) {
    if ( ele == null ) {
      return null;
    }

    return elementUtilities.getSbgnClass( ele ).replace( ' multimer', '' );
  };

  /*
   * Returns if the elements with the given parent class can be parent of the elements with the given node class
   */
  elementUtilities.isValidParent = function(_nodeClass, _parentClass, node) {
    // If nodeClass and parentClass params are elements itselves instead of their class names handle it
    var nodeClass = typeof _nodeClass !== 'string' ? _nodeClass.data('class') : _nodeClass;
    var parentClass = _parentClass != undefined && typeof _parentClass !== 'string' ? _parentClass.data('class') : _parentClass;

    if (parentClass == undefined || parentClass === 'compartment'
            || parentClass === 'submap') { // Compartments, submaps and the root can include any type of nodes
      return true;
    }
    else if (parentClass.startsWith('complex') && (!node || node.connectedEdges().length == 0  // Complexes can only include EPNs which do not have edges
            || elementUtilities.mapType == "Unknown")) { // When map type is unknown, allow complexes to include EPNs with edges
      return elementUtilities.isEPNClass(nodeClass);
    }

    return false; // Currently just 'compartment' and 'complex' compounds are supported return false for any other parentClass
  };

  // Get common properties of given elements. Returns null if the given element list is empty or the
  // property is not common for all elements. dataOrCss parameter specify whether to check the property on data or css.
  // The default value for it is data. If propertyName parameter is given as a function instead of a string representing the
  // property name then use what that function returns.
  elementUtilities.getCommonProperty = function (elements, propertyName, dataOrCss) {
    if (elements.length == 0) {
      return null;
    }

    var isFunction;
    // If we are not comparing the properties directly users can specify a function as well
    if (typeof propertyName === 'function') {
      isFunction = true;
    }

    // Use data as default
    if (!isFunction && !dataOrCss) {
      dataOrCss = 'data';
    }

    var getVal = function( index ) {
        var val = isFunction ? propertyName(elements[index]) : elements[index][dataOrCss](propertyName);
        return val;
    }

    var value = getVal( 0 );

    for (var i = 1; i < elements.length; i++) {
      if ( getVal( i ) != value) {
        return null;
      }
    }

    return value;
  };

  // Returns if the function returns a truthy value for all of the given elements.
  elementUtilities.trueForAllElements = function (elements, fcn) {
    for (var i = 0; i < elements.length; i++) {
      if (!fcn(elements[i])) {
        return false;
      }
    }

    return true;
  };

  // Returns whether the give element can have sbgncardinality
  elementUtilities.canHaveSBGNCardinality = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele )

    return sbgnclass == 'consumption' || sbgnclass == 'production';
  };

  // Returns whether the give element can have sbgnlabel
  elementUtilities.canHaveSBGNLabel = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    return sbgnclass != 'and' && sbgnclass != 'or' && sbgnclass != 'not' && sbgnclass != 'delay'
            && sbgnclass != 'association' && sbgnclass != 'dissociation' && sbgnclass != 'source and sink' && !sbgnclass.endsWith('process');
  };

  // Returns whether the give element have unit of information
  elementUtilities.canHaveUnitOfInformation = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    if (sbgnclass == 'simple chemical'
            || sbgnclass == 'macromolecule' || sbgnclass == 'nucleic acid feature'
            || sbgnclass == 'complex' || sbgnclass == 'simple chemical multimer'
            || sbgnclass == 'macromolecule multimer' || sbgnclass == 'nucleic acid feature multimer'
            || sbgnclass == 'complex multimer' || (sbgnclass.startsWith('BA') && sbgnclass != "BA plain")
            || sbgnclass == 'compartment' || sbgnclass == 'protein' || sbgnclass == 'small molecule') {
      return true;
    }
    return false;
  };

  // Returns whether the given element can have more than one units of information
  elementUtilities.canHaveMultipleUnitOfInformation = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );
    return !sbgnclass.startsWith('BA');
  };


  // Returns whether the give element have state variable
  elementUtilities.canHaveStateVariable = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    if (sbgnclass == 'macromolecule' || sbgnclass == 'nucleic acid feature'
            || sbgnclass == 'complex'
            || sbgnclass == 'macromolecule multimer' || sbgnclass == 'nucleic acid feature multimer'
            || sbgnclass == 'complex multimer') {
      return true;
    }
    return false;
  };

  // Returns whether the given ele should be square in shape
  elementUtilities.mustBeSquare = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    return (sbgnclass.indexOf('process') != -1 || sbgnclass == 'source and sink'
            || sbgnclass == 'and' || sbgnclass == 'or' || sbgnclass == 'not'
            || sbgnclass == 'association' || sbgnclass == 'dissociation' || sbgnclass == 'delay');
  };

  // Returns whether any of the given nodes must not be in square shape
  elementUtilities.someMustNotBeSquare = function (nodes) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!elementUtilities.mustBeSquare(node.data('class'))) {
        return true;
      }
    }

    return false;
  };

  // Returns whether the gives element can be cloned
  elementUtilities.canBeCloned = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    var list = {
      'unspecified entity': true,
      'macromolecule': true,
      'complex': true,
      'nucleic acid feature': true,
      'simple chemical': true,
      'perturbing agent': true
    };

    return list[sbgnclass] ? true : false;
  };

  // Returns whether the gives element can be cloned
  elementUtilities.canBeMultimer = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    var list = {
      'macromolecule': true,
      'complex': true,
      'nucleic acid feature': true,
      'simple chemical': true
    };

    return list[sbgnclass] ? true : false;
  };

  elementUtilities.isBiologicalActivity = function( ele ) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    return inArray( sbgnclass, elementUtilities.biologicalActivityTypes );
  };

  elementUtilities.isSIFNode = function( ele ) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    return inArray( sbgnclass, elementUtilities.sifTypes );
  };

  // Returns whether the given element is an EPN
  elementUtilities.isEPNClass = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    return inArray( sbgnclass, elementUtilities.epnTypes );
  };

  // Returns whether the given element is a PN
  elementUtilities.isPNClass = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    return inArray( sbgnclass, elementUtilities.processTypes );
  };

  // Returns wether the given element or string is of the special empty set/source and sink class
  elementUtilities.isEmptySetClass = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );
    return sbgnclass == 'source and sink';
  };

  // Returns whether the given element is a logical operator
  elementUtilities.isLogicalOperator = function( ele ) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );
    return inArray( sbgnclass, elementUtilities.logicalOperatorTypes );
  };

  // Returns whether the class of given element is a equivalance class
  elementUtilities.convenientToEquivalence = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );
    return (sbgnclass == 'tag' || sbgnclass == 'terminal');
  };

  // Returns whether the class of given element is a modulation arc as defined in PD specs
  elementUtilities.isModulationArcClass = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );
    return (sbgnclass == 'modulation'
            || sbgnclass == 'stimulation' || sbgnclass == 'catalysis'
            || sbgnclass == 'inhibition' || sbgnclass == 'necessary stimulation');
  };

  // Returns whether the class of given element is an arc of AF specs except logical arc
  elementUtilities.isAFArcClass = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );
    return (sbgnclass == 'positive influence' || sbgnclass == 'negative influence'
            || sbgnclass == 'unknown influence' || sbgnclass == 'necessary stimulation');
  };

  // Returns whether the given element or elements with the given class can have ports.
  elementUtilities.canHavePorts = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );
    return sbgnclass != 'phenotype' && sbgnclass != 'delay'
            && ( elementUtilities.isLogicalOperator( sbgnclass )
                  || elementUtilities.isPNClass( sbgnclass ) );
  };

  // Section Start
  // General Element Utilities

  //this method returns the nodes non of whose ancestors is not in given nodes
  elementUtilities.getTopMostNodes = function (nodes) {
      var nodesMap = {};
      for (var i = 0; i < nodes.length; i++) {
          nodesMap[nodes[i].id()] = true;
      }
      var roots = nodes.filter(function (ele, i) {
          if(typeof ele === "number") {
            ele = i;
          }
          var parent = ele.parent()[0];
          while(parent != null){
            if(nodesMap[parent.id()]){
              return false;
            }
            parent = parent.parent()[0];
          }
          return true;
      });

      return roots;
  };

  //This method checks if all of the given nodes have the same parent assuming that the size
  //of  nodes is not 0
  elementUtilities.allHaveTheSameParent = function (nodes) {
      if (nodes.length == 0) {
          return true;
      }
      var parent = nodes[0].data("parent");
      for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (node.data("parent") != parent) {
              return false;
          }
      }
      return true;
  };

  elementUtilities.moveNodes = function(positionDiff, nodes, notCalcTopMostNodes) {
    var topMostNodes = notCalcTopMostNodes ? nodes : this.getTopMostNodes(nodes);
    for (var i = 0; i < topMostNodes.length; i++) {
      var node = topMostNodes[i];
      var oldX = node.position("x");
      var oldY = node.position("y");
      node.position({
        x: oldX + positionDiff.x,
        y: oldY + positionDiff.y
      });
      var children = node.children();
      this.moveNodes(positionDiff, children, true);
    }
  };

  elementUtilities.convertToModelPosition = function (renderedPosition) {
    var pan = cy.pan();
    var zoom = cy.zoom();

    var x = (renderedPosition.x - pan.x) / zoom;
    var y = (renderedPosition.y - pan.y) / zoom;

    return {
      x: x,
      y: y
    };
  };

  // Section End
  // General Element Utilities

  // Section Start
  // Element Filtering Utilities

  // SBGN specific utilities

  elementUtilities.getProcessesOfSelected = function () {
      var selectedEles = cy.elements(":selected");
      selectedEles = this.extendNodeList(selectedEles);
      return selectedEles;
  };

  elementUtilities.getNeighboursOfSelected = function(){
      var selectedEles = cy.elements(":selected");
      var elesToHighlight = this.getNeighboursOfNodes(selectedEles);
      return elesToHighlight;
  };

  elementUtilities.getNeighboursOfNodes = function(_nodes){
      var nodes = _nodes.nodes(); // Ensure that nodes list just include nodes
      nodes = nodes.add(nodes.parents("node[class^='complex']"));
      nodes = nodes.add(nodes.descendants());
      var neighborhoodEles = nodes.neighborhood();
      var elesToReturn = nodes.add(neighborhoodEles);
      elesToReturn = elesToReturn.add(elesToReturn.descendants());
      return elesToReturn;
  };

  elementUtilities.extendNodeList = function (nodesToShow) {
      var self = this;
      //add children
      nodesToShow = nodesToShow.add(nodesToShow.nodes().descendants());
      //add parents
      nodesToShow = nodesToShow.add(nodesToShow.parents());
      //add complex children
      nodesToShow = nodesToShow.add(nodesToShow.nodes("node[class^='complex']").descendants());

      // var processes = nodesToShow.nodes("node[class='process']");
      // var nonProcesses = nodesToShow.nodes("node[class!='process']");
      // var neighborProcesses = nonProcesses.neighborhood("node[class='process']");

      extendNodeTypes = ['process', 'omitted process', 'uncertain process',
      'association', 'dissociation', 'phenotype', 'and', 'or', 'not', 'delay'];

      //Here, logical operators are also considered as processes, since they also get inputs and outputs
      var processes = nodesToShow.filter(function(ele, i){
          if(typeof ele === "number") {
            ele = i;
          }
          return inArray(ele._private.data.class, extendNodeTypes);
      });
      var nonProcesses = nodesToShow.filter(function(ele, i){
          if(typeof ele === "number") {
            ele = i;
          }
          return !inArray(ele._private.data.class, extendNodeTypes);
      });
      var neighborProcesses = nonProcesses.neighborhood().union(processes.neighborhood()).filter(function(ele, i){
          if(typeof ele === "number") {
            ele = i;
          }
          return inArray(ele._private.data.class, extendNodeTypes);
      });
      //For AF support, subject to change
      var neighborNonProcesses = nonProcesses.union(nonProcesses.neighborhood(":hidden")).filter(function(ele, i){
          if(typeof ele === "number") {
            ele = i;
          }
          return !inArray(ele._private.data.class, extendNodeTypes);
      });

      nodesToShow = nodesToShow.add(processes.neighborhood());
      nodesToShow = nodesToShow.add(neighborProcesses);
      nodesToShow = nodesToShow.add(neighborProcesses.neighborhood());
      nodesToShow = nodesToShow.add(neighborNonProcesses);

      neighborProcesses.neighborhood().forEach(function(ele){
          if(inArray(ele._private.data.class, extendNodeTypes))
          {
             nodesToShow = nodesToShow.add(ele.neighborhood());
          }
      });

      //add parents
      nodesToShow = nodesToShow.add(nodesToShow.nodes().parents());
      //add children
      nodesToShow = nodesToShow.add(nodesToShow.nodes("node[class^='complex']").descendants());

      return nodesToShow;
  };

  elementUtilities.extendRemainingNodes = function (nodesToFilter, allNodes) {
      nodesToFilter = this.extendNodeList(nodesToFilter);
      var nodesToShow = allNodes.not(nodesToFilter);
      nodesToShow = this.extendNodeList(nodesToShow);
      return nodesToShow;
  };

  elementUtilities.getProcessesOfNodes = function(nodes) {
    return this.extendNodeList(nodes);
  };

  // general utilities

  elementUtilities.noneIsNotHighlighted = function(){
      var highlightedNodes = cy.nodes(":visible").nodes(".highlighted");
      var highlightedEdges = cy.edges(":visible").edges(".highlighted");

      return highlightedNodes.length + highlightedEdges.length === 0;
  };

  // Section End
  // Element Filtering Utilities

  // Section Start
  // Add remove utilities

  // SBGN specific utilities

  elementUtilities.deleteNodesSmart = function (_nodes) {
    var nodes = _nodes.nodes(); // Ensure that nodes list just include nodes

    var allNodes = cy.nodes();
    cy.elements().unselect();
    var nodesToKeep = this.extendRemainingNodes(nodes, allNodes);
    var nodesNotToKeep = allNodes.not(nodesToKeep);
    return nodesNotToKeep.remove();
  };

  elementUtilities.deleteElesSimple = function (eles) {
    cy.elements().unselect();
    return eles.remove();
  };

  // general utilities

  elementUtilities.restoreEles = function (eles) {
      eles.restore();
      return eles;
  };

  // Section End
  // Add remove utilities

  // Section Start
  // Stylesheet helpers

  // SBGN specific utilities

  elementUtilities.getArrayLineStyle = function (ele) {
    var sbgnclass = elementUtilities.getPureSbgnClass( ele );

    switch (sbgnclass) {
      case 'controls-expression-of': case 'upregulates-expression':
      case 'downregulates-expression':
        return 'dashed';
      default:
        return 'solid';
    }
  };

  elementUtilities.getCyShape = function (ele) {
      var _class = ele.data('class');
      // Get rid of rectangle postfix to have the actual node class
      if (_class.endsWith(' multimer')) {
          _class = _class.replace(' multimer', '');
      }

      if (_class == 'compartment') {
          return 'compartment';
      }
      if (_class == 'phenotype') {
          return 'hexagon';
      }
      if (_class == 'perturbing agent' || _class == 'tag') {
          return 'polygon';
      }

      if (_class.startsWith('BA')){
          return 'biological activity';
      }

      if (_class == 'submap' || _class == 'topology group'){
          return 'rectangle';
      }

      // We need to define new node shapes with their class names for these nodes
      if (_class == 'source and sink' || _class == 'nucleic acid feature' || _class == 'macromolecule'
              || _class == 'simple chemical' || _class == 'complex' || _class == 'biological activity'
              || _class == 'small molecule' || _class == 'protein' ) {
          return _class;
      }

      // These shapes can have ports. If they have ports we represent them by polygons, else they are represented by ellipses or rectangles
      // conditionally.
      if ( this.canHavePorts(_class) ) {

        if (graphUtilities.portsEnabled === true && ele.data('ports').length === 2) {
          return 'polygon'; // The node has ports represent it by polygon
        }
        else if (_class == 'process' || _class == 'omitted process' || _class == 'uncertain process') {
          return 'rectangle'; // If node has no port and has one of these classes it should be in a rectangle shape
        }

        return 'ellipse'; // Other nodes with no port should be in an ellipse shape
      }

      // The remaining nodes are supposed to be in ellipse shape
      return 'ellipse';
  };

  elementUtilities.getCyArrowShape = function(ele) {
      var _class = ele.data('class');

      switch ( _class ) {
        case 'necessary stimulation':
          return 'triangle-cross';
        case 'inhibition': case 'negative influence': case 'inhibits':
        case 'downregulates-expression': case 'dephosphorylates':
          return 'tee';
        case 'catalysis':
          return 'circle';
        case 'stimulation': case 'production': case 'positive influence':
        case 'activates': case 'phosphorylates': case 'upregulates-expression':
        case 'controls-state-change-of': case 'chemical-affects':
        case 'controls-transport-of': case 'controls-phosphorylation-of':
        case 'controls-expression-of': case 'catalysis-precedes':
        case 'consumption-controled-by': case 'controls-production-of':
        case 'controls-transport-of-chemical': case 'used-to-produce':
          return 'triangle';
        case 'modulation': case 'unknown influence':
          return 'diamond';
        default:
          return 'none';
      }
  };

  elementUtilities.getElementContent = function(ele) {
      var _class = ele.data('class');

      if (_class.endsWith(' multimer')) {
          _class = _class.replace(' multimer', '');
      }

      var content = "";
      if (_class == 'macromolecule' || _class == 'simple chemical'
          || _class == 'phenotype'
          || _class == 'unspecified entity' || _class == 'nucleic acid feature'
          || _class == 'perturbing agent' || _class == 'tag'
          || _class == 'biological activity' || _class.startsWith('BA')
          || _class == 'submap') {
          content = ele.data('label') ? ele.data('label') : "";
      }
      else if(_class == 'compartment'){
          content = ele.data('label') ? ele.data('label') : "";
      }
      else if(_class == 'complex'){
          if(ele.children().length == 0 || options.showComplexName){
              if(ele.data('label')){
                  content = ele.data('label');
              }
              else if(ele.data('infoLabel')){
                  content = ele.data('infoLabel');
              }
              else{
                  content = '';
              }
          }
          else{
              content = '';
          }
      }
      else if (_class == 'and') {
          content = 'AND';
      }
      else if (_class == 'or') {
          content = 'OR';
      }
      else if (_class == 'not') {
          content = 'NOT';
      }
      else if (_class == 'omitted process') {
          content = '\\\\';
      }
      else if (_class == 'uncertain process') {
          content = '?';
      }
      else if (_class == 'dissociation') {
          content = 'o';
      }
      else if (_class == 'delay'){
          content = '\u03C4'; // tau
      }

      var textWidth = ele.outerWidth() || ele.data('bbox').w;

      var textProp = {
          label: content,
          width: ( _class == 'perturbing agent' ? textWidth / 2 : textWidth)
      };

      var font = parseInt(ele.css('font-size')) + "px Arial";

      var fitLabelsToNodes = options.fitLabelsToNodes;
      fitLabelsToNodes = typeof fitLabelsToNodes === 'function' ? fitLabelsToNodes.call() : fitLabelsToNodes;

      return fitLabelsToNodes ? truncateText(textProp, font) : textProp.label;
  };

  elementUtilities.getLabelTextSize = function (ele) {
    var _class = ele.data('class');
    // These types of nodes cannot have label but this is statement is needed as a workaround
    if (_class === 'association') {
      return 20;
    }

    if (this.canHavePorts(_class)) {
      var coeff = 1; // The dynamic label size coefficient for these pseudo labels, it is 1 for logical operators

      // Coeff is supposed to be 2 for dissociation and 1.5 for other processes
      if (_class === 'dissociation') {
        coeff = 2;
      }
      else if (_class.endsWith('process')) {
        coeff = 1.5;
      }

      var ports = ele.data('ports');

      if (graphUtilities.portsEnabled === true && ports.length === 2) {
        // We assume that the ports are symmetric to the node center so using just one of the ports is enough
        var port = ports[0];
        var orientation = port.x === 0 ? 'vertical' : 'horizontal';
        // This is the ratio of the area occupied with ports over without ports
        var ratio = orientation === 'vertical' ? Math.abs(port.y) / 50 : Math.abs(port.x) / 50;
        coeff /= ratio; // Divide the coeff by ratio to fit into the bbox of the actual shape (discluding ports)
      }

      return this.getDynamicLabelTextSize(ele, coeff);
    }

    if (_class === 'delay'){
      return this.getDynamicLabelTextSize(ele, 2);
    }

    return this.getDynamicLabelTextSize(ele);
  };

  elementUtilities.getStateVarShapeOptions = function(ele) {
    if ( !elementUtilities.canHaveStateVariable( ele ) ) {
      return null;
    }
    
    return 'stadium';
  };

  elementUtilities.getUnitOfInfoShapeOptions = function(ele) {
    var type = elementUtilities.getPureSbgnClass(ele);

    if ( !elementUtilities.canHaveUnitOfInformation( type ) ) {
      return null;
    }

    var opts = null;

    if ( elementUtilities.isSIFNode( type ) ) {
      opts = ['rectangle', 'stadium'];
    }
    else if ( elementUtilities.isBiologicalActivity( type ) ) {
      switch (type) {
        case 'BA macromolecule':
          opts = ['roundrectangle'];
          break;
        case 'BA nucleic acid feature':
          opts = ['bottomroundrectangle']
          break;
        case 'BA unspecified entity':
          opts = ['ellipse'];
          break;
        case 'BA complex':
          opts = ['complex'];
          break;
        case 'BA perturbing agent':
          opts = ['perturbing agent'];
          break;
        case 'BA simple chemical'
          opts = ['stadium'];
          break;
        default:
          break;
      }
    }
    else {
      opts = ['rectangle'];
    }

    return opts;
  };

  elementUtilities.getCardinalityDistance = function (ele) {
    var srcPos = ele.source().position();
    var tgtPos = ele.target().position();

    var distance = Math.sqrt(Math.pow((srcPos.x - tgtPos.x), 2) + Math.pow((srcPos.y - tgtPos.y), 2));
    return distance * 0.15;
  };

  elementUtilities.getInfoLabel = function(node) {
    /* Info label of a collapsed node cannot be changed if
    * the node is collapsed return the already existing info label of it
    */
    if (node._private.data.collapsedChildren != null) {
      return node._private.data.infoLabel;
    }

    /*
     * If the node is simple then it's infolabel is equal to it's label
     */
    if (node.children() == null || node.children().length == 0) {
      return node._private.data.label;
    }

    var children = node.children();
    var infoLabel = "";
    /*
     * Get the info label of the given node by it's children info recursively
     */
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var childInfo = this.getInfoLabel(child);
      if (childInfo == null || childInfo == "") {
        continue;
      }

      if (infoLabel != "") {
        infoLabel += ":";
      }
      infoLabel += childInfo;
    }

    //return info label
    return infoLabel;
  };

  elementUtilities.getQtipContent = function(node) {
    /* Check the label of the node if it is not valid
    * then check the infolabel if it is also not valid do not show qtip
    */
    var label = node.data('label');
    if (label == null || label == "") {
      label = this.getInfoLabel(node);
    }
    if (label == null || label == "") {
      return;
    }

    var contentHtml = "<b style='text-align:center;font-size:16px;'>" + label + "</b>";
    var statesandinfos = node._private.data.statesandinfos;
    for (var i = 0; i < statesandinfos.length; i++) {
      var sbgnstateandinfo = statesandinfos[i];
      if (sbgnstateandinfo.clazz == "state variable") {
        var value = sbgnstateandinfo.state.value;
        var variable = sbgnstateandinfo.state.variable;
        var stateLabel = (variable == null /*|| typeof stateVariable === undefined */) ? value :
                value + "@" + variable;
        if (stateLabel == null) {
          stateLabel = "";
        }
        contentHtml += "<div style='text-align:center;font-size:14px;'>" + stateLabel + "</div>";
      }
      else if (sbgnstateandinfo.clazz == "unit of information") {
        var stateLabel = sbgnstateandinfo.label.text;
        if (stateLabel == null) {
          stateLabel = "";
        }
        contentHtml += "<div style='text-align:center;font-size:14px;'>" + stateLabel + "</div>";
      }
    }
    return contentHtml;
  };

  // general utilities

  elementUtilities.getDynamicLabelTextSize = function (ele, dynamicLabelSizeCoefficient) {
    var dynamicLabelSize = options.dynamicLabelSize;
    dynamicLabelSize = typeof dynamicLabelSize === 'function' ? dynamicLabelSize.call() : dynamicLabelSize;

    if (dynamicLabelSizeCoefficient === undefined) {
      if (dynamicLabelSize == 'small') {
        if (ele.data("class").startsWith("complex"))
          return 10;
        else if (ele.data("class") == "compartment" || ele.data("class") == "submap")
          return 12;

        dynamicLabelSizeCoefficient = 0.75;
      }
      else if (dynamicLabelSize == 'regular') {
        if (ele.data("class").startsWith("complex"))
          return 11;
        else if (ele.data("class") == "compartment" || ele.data("class") == "submap")
          return 14;

        dynamicLabelSizeCoefficient = 1;
      }
      else if (dynamicLabelSize == 'large') {
        if (ele.data("class").startsWith("complex"))
          return 12;
        else if (ele.data("class") == "compartment" || ele.data("class") == "submap")
          return 16;

        dynamicLabelSizeCoefficient = 1.25;
      }
    }

    var h = ele.height();
    var textHeight = parseInt(h / 2.45) * dynamicLabelSizeCoefficient;

    return textHeight;
  };

  /*
  * Get source/target end point of edge in 'x-value% y-value%' format. It returns 'outside-to-node' if there is no source/target port.
  */
  elementUtilities.getEndPoint = function(edge, sourceOrTarget) {
    var portId = sourceOrTarget === 'source' ? edge.data('portsource') : edge.data('porttarget');

    if (portId == null || !graphUtilities.portsEnabled) {
      return 'outside-to-node'; // If there is no portsource return the default value which is 'outside-to-node'
    }

    var endNode = sourceOrTarget === 'source' ? edge.source() : edge.target();
    var ports = endNode.data('ports');
    var port;
    for (var i = 0; i < ports.length; i++) {
      if (ports[i].id === portId) {
        port = ports[i];
      }
    }

    if (port === undefined) {
      return 'outside-to-node'; // If port is not found return the default value which is 'outside-to-node'
    }

    var x, y;
    // Note that for drawing ports we represent the whole shape by a polygon and ports are always 50% away from the node center
    if (port.x != 0) {
      x = Math.sign(port.x) * 50;
      y = 0;
    }
    else {
      x = 0;
      y = Math.sign(port.y) * 50;
    }

    return '' + x + '% ' + y + '%';
  };

  /*
   * Return ordering of ports of a node.
   * Possible return values are 'L-to-R', 'R-to-L', 'T-to-B', 'B-to-T', 'none'
   */
  elementUtilities.getPortsOrdering = function(node) {
   // Return the cached portsordering if exists
   if (node.data('portsordering')) {
     return node.data('portsordering');
   }

   var ports = node.data('ports');
   if (ports.length !== 2) {
     node.data('portsordering', 'none'); // Cache the ports ordering
     return 'none'; // Nodes are supposed to have 2 nodes or none
   }

   /*
    * Retursn if the given portId is porttarget of any of the given edges.
    * These edges are expected to be the edges connected to the node associated with that port.
    */
   var isPortTargetOfAnyEdge = function(edges, portId) {
     for (var i = 0; i < edges.length; i++) {
       if (edges[i].data('porttarget') === portId) {
         return true;
       }
     }

     return false;
   };

   // If the ports are located above/below of the node then the orientation is 'vertical' else it is 'horizontal'.
   var orientation = ports[0].x === 0 ? 'vertical' : 'horizontal';
   // We need the connected edges of the node to find out if a port is an input port or an output port
   var connectedEdges = node.connectedEdges();

   var portsordering;
   if (orientation === 'horizontal') {
     var leftPortId = ports[0].x < 0 ? ports[0].id : ports[1].id; // Left port is the port whose x value is negative
     // If left port is port target for any of connected edges then the ordering is 'L-to-R' else it is 'R-to-L'
     if (isPortTargetOfAnyEdge(connectedEdges, leftPortId)) {
       portsordering = 'L-to-R';
     }
     else {
       portsordering = 'R-to-L';
     }
   }
   else {
     var topPortId = ports[0].y < 0 ? ports[0].id : ports[1].id; // Top port is the port whose y value is negative
     // If top  port is port target for any of connected edges then the ordering is 'T-to-B' else it is 'B-to-T'
     if (isPortTargetOfAnyEdge(connectedEdges, topPortId)) {
       portsordering = 'T-to-B';
     }
     else {
       portsordering = 'B-to-T';
     }
   }

   // Cache the portsordering and return it.
   node.data('portsordering', portsordering);
   return portsordering;
  };

  /*
  * Sets the ordering of the given nodes.
  * Ordering options are 'L-to-R', 'R-to-L', 'T-to-B', 'B-to-T', 'none'.
  * If a node does not have any port before the operation and it is supposed to have some after operation the portDistance parameter is
  * used to set the distance between the node center and the ports. The default port distance is 60.
  */
  elementUtilities.setPortsOrdering = function( nodes, ordering, portDistance ) {
    /*
    * Returns if the given portId is porttarget of any of the given edges.
    * These edges are expected to be the edges connected to the node associated with that port.
    */
    var isPortTargetOfAnyEdge = function(edges, portId) {
      for (var i = 0; i < edges.length; i++) {
        if (edges[i].data('porttarget') === portId) {
          return true;
        }
      }

      return false;
    };


    /*
    * Returns if the given portId is portsource of any of the given edges.
    * These edges are expected to be the edges connected to the node associated with that port.
    */
    var isPortSourceOfAnyEdge = function(edges, portId) {
      for (var i = 0; i < edges.length; i++) {
        if (edges[i].data('portsource') === portId) {
          return true;
        }
      }

      return false;
    };

    portDistance = portDistance ? portDistance : 70; // The default port distance is 60

    cy.startBatch();

    for ( var i = 0; i < nodes.length; i++ ) {
      var node = nodes[i];
      var currentOrdering = this.getPortsOrdering(node); // The current ports ordering of the node

      // If the current ordering is already equal to the desired ordering pass this node directly
      if ( ordering === currentOrdering ) {
        continue;
      }

      if ( ordering === 'none' ) { // If the ordering is 'none' remove the ports of the node
        elementUtilities.removePorts(node);
      }
      else if ( currentOrdering === 'none' ) { // If the desired ordering is not 'none' but the current one is 'none' add ports with the given parameters.
        elementUtilities.addPorts(node, ordering, portDistance);
      }
      else { // Else change the ordering by altering node 'ports'
        var ports = node.data('ports'); // Ports of the node
        // If currentOrdering is 'none' use the portDistance given by parameter else use the existing one
        var dist = currentOrdering === 'none' ? portDistance : ( Math.abs( ports[0].x ) || Math.abs( ports[0].y ) );
        var connectedEdges = node.connectedEdges(); // The edges connected to the node
        var portsource, porttarget; // The ports which are portsource/porttarget of the connected edges

        // Determine the portsource and porttarget
        if ( isPortTargetOfAnyEdge(connectedEdges, ports[0].id) || isPortSourceOfAnyEdge(connectedEdges, ports[1].id) ) {
          porttarget = ports[0];
          portsource = ports[1];
        }
        else {
          porttarget = ports[1];
          portsource = ports[0];
        }

        if ( ordering === 'L-to-R' ) {
          // If ordering is 'L-to-R' the porttarget should be the left most port and the portsource should be the right most port
          porttarget.x = -1 * dist;
          portsource.x = dist;
          porttarget.y = 0;
          portsource.y = 0;
        }
        else if ( ordering === 'R-to-L' ) {
          // If ordering is 'R-to-L' the porttarget should be the right most port and the portsource should be the left most port
          porttarget.x = dist;
          portsource.x = -1 * dist;
          porttarget.y = 0;
          portsource.y = 0;
        }
        else if ( ordering === 'T-to-B' ) {
          // If ordering is 'T-to-B' the porttarget should be the top most port and the portsource should be the bottom most port
          porttarget.x = 0;
          portsource.x = 0;
          porttarget.y = -1 * dist;
          portsource.y = dist;
        }
        else  { //if ordering is 'B-to-T'
          // If ordering is 'B-to-T' the porttarget should be the bottom most port and the portsource should be the top most port
          porttarget.x = 0;
          portsource.x = 0;
          porttarget.y = dist;
          portsource.y = -1 * dist;
        }
      }

      node.data('ports', ports); // Reset the node ports
    }

    nodes.data('portsordering', ordering); // Update the cached orderings of the nodes
    cy.endBatch();
  };

  /*
  * Add ports to the given node, with given ordering and port distance.
  */
  elementUtilities.addPorts = function(node, ordering, portDistance) {
    var firstPortId = node.id() + ".1"; // Id of first port
    var secondPortId = node.id() + ".2"; // Id of seconf port
    // First port object x and y will be filled according to ordering, the first port is supposed to be the left most or the top most one
    var firstPort = { id: firstPortId };
    // Second port object x and y will be filled according to ordering, the second port is supposed to be the right most or the bottom most one
    var secondPort = { id: secondPortId };

    // Complete port objects according to ordering
    if ( ordering === 'L-to-R' || ordering === 'R-to-L' ) {
      // If ordering is in horizontal axis first port is the left most one and the second port is the right most one
      firstPort.x = -1 * portDistance;
      secondPort.x = portDistance;
      firstPort.y = 0;
      secondPort.y = 0;
    }
    else { // If ordering is 'T-to-B' or 'B-to-T'
       // If ordering is in vertical axis first port is the top most one and the second port is the bottom most one
      firstPort.y = -1 * portDistance;
      secondPort.y = portDistance;
      firstPort.x = 0;
      secondPort.x = 0;
    }

    var fromLorT = ordering === 'L-to-R' || ordering === 'T-to-B'; // Check if ordering starts from left or top
    var ports = [firstPort, secondPort]; // Ports array for the node
    var connectedEdges = node.connectedEdges(); // The edges connected to the node

    cy.startBatch();

    node.data('ports', ports);

    // Reset the portsource and porttarget for each edge connected to the node
    for ( var i = 0; i < connectedEdges.length; i++ ) {
      var edge = connectedEdges[i];
      var edgeClass = edge.data('class');
      /*
       * If the node is the edge target we may need to set the porttarget of the edge to the input port of the node (First or second port accoring to the orientation)
       * if it is the edge soruce we may need to set the portsource of the edge to the output port similarly.
       * Note that if fron left or top (fromLorT) is true then the first port is the source port and second port is the target port,
       * else it is vice versa.
       *
       */
      if ( edge.data('target') === node.id() ) {
        if (edgeClass === 'production' || this.isModulationArcClass(edgeClass)) {
          continue; // production or modulation type of edges cannot be connected to any port of target node (A production can have a process as target node but it is supposed to be connected to that node from its body, not from a port)
        }
        if ( fromLorT ) {
          edge.data('porttarget', firstPortId);
        }
        else {
          edge.data('porttarget', secondPortId);
        }
      }
      else {
        if (edgeClass === 'consumption') {
          continue; // consumpiton edge cannot be connected to any port of source node
        }
        if ( fromLorT ) {
          edge.data('portsource', secondPortId);
        }
        else {
          edge.data('portsource', firstPortId);
        }
      }
    }

    cy.endBatch();
  };

  /*
  * Remove the ports of the given node
  */
  elementUtilities.removePorts = function(node) {
    var connectedEdges = node.connectedEdges();
    var nodeId = node.id();

    cy.startBatch();

    // Reset portsource or porttarget of the connected edges to the node id
    for ( var i = 0; i < connectedEdges.length; i++ ) {
      var edge = connectedEdges[i];
      if ( edge.data('source') === nodeId ) {
        edge.data('portsource', nodeId);
      }
      else {
        edge.data('porttarget', nodeId);
      }
    }

    node.data('ports', []); // Clear ports data

    cy.endBatch();
  };

  elementUtilities.changePortsOrientationAfterLayout = function() {
      //Check all processes and logical operators with ports
      cy.nodes().forEach(function(ele){
          if (ele.data('class') === 'process' || ele.data('class') === 'omitted process' || ele.data('class') === 'uncertain process' || ele.data('class') === 'association' || ele.data('class') === 'dissociation' || ele.data('class') === 'and' || ele.data('class') === 'or' || ele.data('class') === 'not')
          {
              if ( ele.data('ports').length === 2 )
              {
                  var bestOrientation = elementUtilities.changePortsOrientation(ele);
                  elementUtilities.setPortsOrdering(ele, bestOrientation);
                  // If improve-flow is checked we do the swaping of simple nodes with each other
                  var improveFlow = options.improveFlow;
                  improveFlow = typeof improveFlow === 'function' ? improveFlow.call() : improveFlow;
                  if (improveFlow)
                  {
                      elementUtilities.postChangePortsOrientation(ele, bestOrientation);
                  }
              }
          }
      });
      cy.style().update();
  };

  /*
   Calculates the best orientation for an 'ele' with port (process or logical operator) and returns it.
   */
  elementUtilities.changePortsOrientation = function(ele) {
      var processId = ele.id();
      var orientation = {'L-to-R': 0, 'R-to-L' : 0, 'T-to-B' : 0, 'B-to-T' : 0};
      var targetingEdges = cy.edges("[target='"+processId+"']"); // Holds edges who have the input port as a target
      var sourcingEdges = cy.edges("[source='"+processId+"']"); // Holds edges who have the output port as a source
      // Checks if the ports belong to a process or logial operator, it does the calculations based on the edges connected to its ports
      if (ele.data('class') === 'process' || ele.data('class') === 'omitted process' || ele.data('class') === 'uncertain process' || ele.data('class') === 'association' || ele.data('class') === 'dissociation')
      {
          targetingEdges.forEach(function(edge){
              if (edge.data('class') === 'consumption')
              {
                  var source = cy.getElementById(edge.data('source')); //Holds the element from the other side of edge
                  var simple = false; //Checks if it is a simple node - connected with only 1 edge
                  if (source.connectedEdges().length === 1)
                      simple = true;
                  elementUtilities.calculateOrientationScore(ele, source, orientation, 'L-to-R', 'R-to-L', 'x', simple);
                  elementUtilities.calculateOrientationScore(ele, source, orientation, 'T-to-B', 'B-to-T', 'y', simple);
              }
          });
          sourcingEdges.forEach(function (edge) {
              if (edge.data('class') === 'production') {
                  var target = cy.getElementById(edge.data('target'));
                  var simple = false;
                  if (target.connectedEdges().length === 1)
                      simple = true;
                  elementUtilities.calculateOrientationScore(ele, target, orientation, 'R-to-L', 'L-to-R', 'x', simple);
                  elementUtilities.calculateOrientationScore(ele, target, orientation, 'B-to-T', 'T-to-B', 'y', simple);
              }
          });
      }
      else if (ele.data('class') === 'and' || ele.data('class') === 'or' || ele.data('class') === 'not')
      {
          targetingEdges.forEach(function(edge){
              if (edge.data('class') === 'logic arc')
              {
                  var source = cy.getElementById(edge.data('source'));
                  var simple = false;
                  if (source.connectedEdges().length === 1)
                      simple = true;
                  elementUtilities.calculateOrientationScore(ele, source, orientation, 'L-to-R', 'R-to-L', 'x', simple);
                  elementUtilities.calculateOrientationScore(ele, source, orientation, 'T-to-B', 'B-to-T', 'y', simple);
              }
          });
          sourcingEdges.forEach(function (edge) {
              if (edge.data('class') === 'modulation' || edge.data('class') === 'stimulation' || edge.data('class') === 'catalysis' || edge.data('class') === 'inhibition' || edge.data('class') === 'necessary stimulation' || edge.data('class') === 'logic arc') {
                  var target = cy.getElementById(edge.data('target'));
                  var simple = false;
                  if (target.connectedEdges().length === 1)
                      simple = true;
                  elementUtilities.calculateOrientationScore(ele, target, orientation, 'R-to-L', 'L-to-R', 'x', simple);
                  elementUtilities.calculateOrientationScore(ele, target, orientation, 'B-to-T', 'T-to-B', 'y', simple);
              }
          });
      }
      //Calculates the best orientation from all orientation scores
      var bestOrientation = "L-to-R";
      var bestScore = orientation['L-to-R'];//The score of the best orientation is always positive
      for (var property in orientation) {
          if (orientation[property] > bestScore)
          {
              bestScore = orientation[property];
              bestOrientation = property;
          }
      }
      return bestOrientation;
  };

  /*
   This function calculates the scores for each orientation
   @param ele - is the node (process, logical operator) whose orientation will be changed. It can be process,omitted process,
   uncertain process, association, dissociation, logical operator
   @param other - is the other node, and based on its position scores are given to orientations
   @param orientation - holds scores for each orientation
   @param firstOrientation - can be L-to-R or T-to-B
   @param oppositeOrientation - opposite of the upper orientation (R-to-L , B-to-T)
   @param pos - can be 'x' or 'y' (based on vertical or horizontal direction of ports)
   @param simple - checks if 'other' node is simple node (with degree 1)
   */
   elementUtilities.calculateOrientationScore = function(ele, other, orientation, firstOrientation, oppositeOrientation, pos, simple) {
     var coeff = 0.5;
     var score = 2;
     if (simple)
         score = 1; // If it is a simple node, its score should affect less
     var nodeWidthOrHeight = 0;
     if (pos === 'x')
         nodeWidthOrHeight = ele.width()/2;
     else if (pos ==='y')
         nodeWidthOrHeight = ele.height()/2;
     if (other.position(pos) < ele.position(pos) - nodeWidthOrHeight)
     {
         orientation[firstOrientation] += score;
         orientation[oppositeOrientation] -= score;
     }
     else if (other.position(pos) >= ele.position(pos) - nodeWidthOrHeight && other.position(pos) <= ele.position(pos) + nodeWidthOrHeight)
     {
         orientation[firstOrientation] += (ele.position(pos) - other.position(pos))/nodeWidthOrHeight*coeff;
         orientation[oppositeOrientation] -= (ele.position(pos) - other.position(pos))/nodeWidthOrHeight*coeff;
     }
     else if (other.position(pos) >  ele.position(pos) + nodeWidthOrHeight)
     {
         orientation[firstOrientation] -= score;
         orientation[oppositeOrientation] += score;
     }
  };

  /*
  After a process is oriented, for each simple node that is on the wrong side of the port,
  we try to find another simple node of degree 0 on the opposite side and swap them afterwards.
  If from the opposide side we cannot find such a node then we try to swap it with an effector node of degree 1
  */
  elementUtilities.postChangePortsOrientation = function(ele, bestOrientation) {
      var processId = ele.id();
      var inputPort = []; // Holds all simple nodes connected with input port
      var outputPort = []; // Holds all simple nodes connected with output port
      var notConnectedToPort = []; // Holds all simple nodes not connected with input or output port
      var targetingEdges = cy.edges("[target='"+processId+"']");
      var sourcingEdges = cy.edges("[source='"+processId+"']");
      // Checks simple nodes and add them to one of the arrays mentioned above
      if (ele.data('class') === 'process' || ele.data('class') === 'omitted process' || ele.data('class') === 'uncertain process' || ele.data('class') === 'association' || ele.data('class') === 'dissociation')
      {
          targetingEdges.forEach(function(edge){
              var source = cy.getElementById(edge.data('source'));
              if (edge.data('class') === 'consumption')
              {
                  elementUtilities.addSimpleNodeToArray(ele, source, bestOrientation, inputPort, "input");
              }
              else
              {
                  elementUtilities.addSimpleNodeToArray(ele, source, bestOrientation, notConnectedToPort, "notConnected");
              }
          });
          sourcingEdges.forEach(function (edge) {
              var target = cy.getElementById(edge.data('target'));
              if (edge.data('class') === 'production') {
                  elementUtilities.addSimpleNodeToArray(ele, target, bestOrientation, outputPort, "output");
              }
              else
              {
                  elementUtilities.addSimpleNodeToArray(ele, target, bestOrientation, notConnectedToPort, "notConnected");
              }
          });
      }
      else if (ele.data('class') === 'and' || ele.data('class') === 'or' || ele.data('class') === 'not')
      {
          targetingEdges.forEach(function(edge){
              var source = cy.getElementById(edge.data('source'));
              if (edge.data('class') === 'logic arc')
              {
                  elementUtilities.addSimpleNodeToArray(ele, source, bestOrientation, inputPort, "input");
              }
              else
              {
                  elementUtilities.addSimpleNodeToArray(ele, source, bestOrientation, notConnectedToPort, "notConnected");
              }
          });
          sourcingEdges.forEach(function (edge) {
              var target = cy.getElementById(edge.data('target'));
              if (edge.data('class') === 'modulation' || edge.data('class') === 'stimulation' || edge.data('class') === 'catalysis' || edge.data('class') === 'inhibition' || edge.data('class') === 'necessary stimulation' || edge.data('class') === 'logic arc')
              {
                  elementUtilities.addSimpleNodeToArray(ele, target, bestOrientation, outputPort, "output");
              }
              else
              {
                  elementUtilities.addSimpleNodeToArray(ele, target, bestOrientation, notConnectedToPort, "notConnected");
              }
          });
      }
      //The arrays are sorted in order to keep the high priority of nodes positioned completely to the other side
      inputPort.sort(function(a, b){return b.score - a.score});
      outputPort.sort(function(a, b){return b.score - a.score});
      notConnectedToPort.sort(function(a, b){return a.score - b.score});
      //First we check for direct swaping between nodes from different ports positioned to the wrong side
      var minLength = inputPort.length;
      if (outputPort.length < minLength)
          minLength = outputPort.length;
      for (i = 0; i < minLength; i++)
      {
          var inputPortEle = inputPort.pop();
          var outputPortEle = outputPort.pop();
          //Checks if free nodes belong to the same compound
          var firstNode = cy.getElementById(inputPortEle.id);
          var secondNode = cy.getElementById(outputPortEle.id);
          if (firstNode.data('parent') !== secondNode.data('parent'))
          {
              continue;
          }
          elementUtilities.swapElements(inputPortEle, outputPortEle);
      }
      /*
       After that we iterate over each element of effector nodes and see the scores it produces by swaping
       with nodes connected to input or output ports
       */
      for (i = notConnectedToPort.length -1; i >= 0 ; i--)
      {
          var effector = notConnectedToPort[i];
          if (outputPort.length > 0)
          {
              var firstOutput = outputPort[outputPort.length - 1];
              //Checks if free nodes belong to the same compound
              var firstNode = cy.getElementById(effector.id);
              var secondNode = cy.getElementById(firstOutput.id);
              if (firstNode.data('parent') !== secondNode.data('parent'))
              {
                  continue;
              }

              elementUtilities.swapElements(effector, firstOutput);
              var firstOutputScore = -elementUtilities.checkNegativeOrientationScore(ele, cy.getElementById(firstOutput.id), bestOrientation);
              if ( firstOutputScore > firstOutput.score)
              {
                  outputPort.pop();
              }
              else
                  elementUtilities.swapElements(effector, firstOutput); //swap back
          }
          else if (inputPort.length > 0)
          {
              var firstInput = inputPort[inputPort.length - 1];
              //Checks if free nodes belong to the same compound
              var firstNode = cy.getElementById(effector.id);
              var secondNode = cy.getElementById(firstInput.id);
              if (firstNode.data('parent') !== secondNode.data('parent'))
              {
                  continue;
              }

              elementUtilities.swapElements(effector, firstInput);
              var firstInputScore = elementUtilities.checkNegativeOrientationScore(ele, cy.getElementById(firstInput.id), bestOrientation);
              if ( firstInputScore > firstInput.score)
              {
                  inputPort.pop();
              }
              else
                  elementUtilities.swapElements(effector, firstInput);
          }
      }
  };

  /*
  * Adds simple nodes when they have negative score to inputPort, outputPort or notConnectedPort arrays
  * */
  elementUtilities.addSimpleNodeToArray = function(ele, other, orientation, array, connectedTo) {
      if (other.connectedEdges().length === 1)
      {
          var nodeScore;
          var obj = {};
          if (connectedTo === "notConnected")
          {
              nodeScore = Math.abs(elementUtilities.checkNegativeOrientationScore(ele, other, orientation));
              obj['id'] = other.id();
              obj['score'] = nodeScore;
              array.push(obj);
          }
          else
          {
              if (connectedTo === "input")
                  nodeScore = elementUtilities.checkNegativeOrientationScore(ele, other, orientation);
              else if (connectedTo === "output")
                  nodeScore = -elementUtilities.checkNegativeOrientationScore(ele, other, orientation);
              if (nodeScore < 0) //if it is in the wrong side we add it to the input array
              {
                  obj['id'] = other.id();
                  obj['score'] = nodeScore;
                  array.push(obj);
              }
          }
      }
  };

  /*
  This function calculates the score of a node based on its position with respect to a process/logical operator
  @param ele - is the node with the ports. It can be process,omitted process,
  uncertain process, association, dissociation, logical operator
  @param other - is the other node, and based on its position score of a node is calculated
  @param orientation - A string which holds current best orientation
  */
  elementUtilities.checkNegativeOrientationScore = function(ele, other, orientation) {
      var coeff = 0.5;
      var score = 1;
      if (orientation === 'L-to-R' || orientation === 'R-to-L')
      {
          var nodeWidth = ele.width()/2;
          if (other.position('x') < ele.position('x') - nodeWidth)
          {
              if (orientation === 'L-to-R')
                  return score;
              else if (orientation === 'R-to-L')
                  return -score;
          }
          else if (other.position('x') >= ele.position('x') - nodeWidth && other.position('x') <= ele.position('x') + nodeWidth)
          {
              if (orientation === 'L-to-R')
                  return (ele.position('x') - other.position('x'))/nodeWidth*coeff;
              else if (orientation === 'R-to-L')
                  return -(ele.position('x') - other.position('x'))/nodeWidth*coeff;
          }
          else if (other.position('x') > ele.position('x') + nodeWidth)
          {
              if (orientation === 'L-to-R')
                  return -score;
              else if (orientation === 'R-to-L')
                  return score;
          }
      }
      if (orientation === 'T-to-B' || orientation === 'B-to-T')
      {
          var nodeHeight = ele.height()/2;
          if (other.position('y') < ele.position('y') - nodeHeight)
          {
              if (orientation === 'T-to-B')
                  return score;
              else if (orientation === 'B-to-T')
                  return -score;
          }
          else if (other.position('y') >= ele.position('y') - nodeHeight && other.position('y') <= ele.position('y') + nodeHeight)
          {
              if (orientation === 'T-to-B')
                  return (ele.position('y') - other.position('y'))/nodeHeight*coeff;
              else if (orientation === 'B-to-T')
                  return -(ele.position('y') - other.position('y'))/nodeHeight*coeff;
          }
          else if (other.position('y') > ele.position('y') + nodeHeight)
          {
              if (orientation === 'T-to-B')
                  return -score;
              else if (orientation === 'B-to-T')
                  return score;
          }
      }
  };

  /*
  Swaps the positions of 2 elements
  */
  elementUtilities.swapElements = function(firstEle, secondEle) {
      var firstNode = cy.getElementById(firstEle.id);
      var secondNode = cy.getElementById(secondEle.id);
      var tempx = firstNode.position('x');
      var tempy = firstNode.position('y');
      firstNode.position('x', secondNode.position('x'));
      firstNode.position('y', secondNode.position('y'));
      secondNode.position('x', tempx);
      secondNode.position('y', tempy);
  };

  // used for handling the variable property of complexes
  elementUtilities.getComplexPadding = function(ele) {
    // this property needs to take into account:
    // - presence of a label
    // - option to display complex labels
    // - presence of states and info box on the bottom
    var padding = graphUtilities.getCompoundPaddings();
    if (options.showComplexName && elementUtilities.getElementContent(ele)) {
      padding += options.extraComplexPadding * 0.5;
      // if there is something on the bottom side
      if (ele.data('auxunitlayouts') && ele.data('auxunitlayouts').bottom && ele.data('auxunitlayouts').bottom.units.length > 0) {
        padding += options.extraComplexPadding * 0.5;
      }
    }
    // for the case where the padding is the tightest, we need a bit of extra space
    // to avoid touching the infoboxes of the complex
    else {
      if (ele.data('statesandinfos').length > 0) {
        padding += 2;
      }
    }
    return padding;
  };

  // used for handling the variable property of complexes
  elementUtilities.getComplexMargin = function(ele) {
    // this property needs to take into account:
    // - presence of a label
    // - option to display complex labels
    // - presence of states and info box on the bottom
    var margin =  -1 * options.extraComplexPadding;

    if (options.showComplexName &&
        elementUtilities.getElementContent(ele) &&
        ele.data('auxunitlayouts') && // check if there is something on the bottom side
        ele.data('auxunitlayouts').bottom &&
        ele.data('auxunitlayouts').bottom.units.length > 0) {
      margin -= options.extraComplexPadding * 0.5;
    }

    if (ele.css("font-size") == "14px")
      margin -= 2;

    return margin;
  };

  
  // Set clone marker status of given nodes to the given status.
  elementUtilities.setCloneMarkerStatus = function (node, status) {
    if (status)
        node.data('clonemarker', true);
    else 
        node.removeData('clonemarker');
    
    if(node.data('class') !== "unspecified entity" && node.data('class') !== "perturbing agent")
        return;

    var bgObj = {
        'background-image': 'data:image/svg+xml;utf8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%20style%3D%22fill%3Anone%3Bstroke%3Ablack%3Bstroke-width%3A0%3B%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22100%22%20height%3D%22100%22%20style%3D%22fill%3A%23a9a9a9%22/%3E%20%3C/svg%3E',
        'background-position-x': '50%',
        'background-position-y': '100%',
        'background-width': '100%',
        'background-height': '25%',
        'background-fit': 'none',
        'background-image-opacity': '0'
    };
    
    var imgs = node.data('background-image') ? node.data('background-image').split(" ") : [];
    var xPos = node.data('background-position-x') ? node.data('background-position-x').split(" ") : [];
    var yPos = node.data('background-position-y') ? node.data('background-position-y').split(" ") : [];
    var widths = node.data('background-width') ? node.data('background-width').split(" ") : [];
    var heights = node.data('background-height') ? node.data('background-height').split(" ") : [];
    var fits = node.data('background-fit') ? node.data('background-fit').split(" ") : [];
    var opacities = node.data('background-image-opacity') ? ("" + node.data('background-image-opacity')).split(" ") : [];

    if(status){
        var index = imgs.indexOf(bgObj['background-image']);
        // Already exists; Make opacity non-zero
        if( index > -1)
            opacities[index] = node.css('background-opacity');
        else{
            imgs.push(bgObj['background-image']);
            xPos.push(bgObj['background-position-x']);
            yPos.push(bgObj['background-position-y']);
            widths.push(bgObj['background-width']);
            heights.push(bgObj['background-height']);
            fits.push(bgObj['background-fit']);
            opacities.push(node.css('background-opacity'));
        }
    }
    else{
        var index = imgs.indexOf(bgObj['background-image']);
        // Already exists; Make opacity zero
        if( index > -1)
            opacities[index] = '0';
    }

    node.data('background-image', imgs.join(" "));
    node.data('background-position-x', xPos.join(" "));
    node.data('background-position-y', yPos.join(" "));
    node.data('background-width', widths.join(" "));
    node.data('background-height', heights.join(" "));
    node.data('background-fit', fits.join(" "));
    node.data('background-image-opacity', opacities.join(" "));
  };

  // Section End
  // Stylesheet helpers

  var defaultProperties = {
  };

  var getDefaultNodeProperties = function() {
    return {
      'border-width': 1.25,
      'border-color': '#555',
      'background-color': '#ffffff',
      'background-opacity': 1,
      'text-wrap': 'wrap'
    };
  };

  var getDefaultEdgeProperties = function() {
    return {
      'line-color': '#555',
      'width': 1.25
    };
  };

  var getDefaultProcessSize = function() {
    return {
      width: 20,
      height: 20
    };
  };

  var getDefaultLogicalOperatorSize = function() {
    return {
      width: 30,
      height: 30
    };
  };

  var getDefaultBASize = function() {
    return {
      width: 60,
      height: 30
    };
  };

  var defaultSizeMap = {
    'macromolecule': {
      width: 60,
      height: 30
    },
    'nucleic acid feature': {
      width: 60,
      height: 30
    },
    'simple chemical': {
      width: 30,
      height: 30
    },
    'source and sink': {
      width: 22,
      height: 22
    },
    'phenotype': {
      width: 60,
      height: 30
    },
    'unspecified entity': {
      width: 60,
      height: 30
    },
    'perturbing agent': {
      width: 60,
      height: 30
    },
    'complex': {
      width: 44,
      height: 44
    },
    'compartment': {
      width: 80,
      height: 80
    },
    'submap': {
      width: 80,
      height: 80
    },
    'tag': {
      width: 35,
      height: 35
    },
    'protein': {
      width: 60,
      height: 30
    },
    'small molecule': {
      width: 48,
      height: 24
    }
  };

  elementUtilities.processTypes.forEach( function( type ) {
    // phenotype has a different default size
    if ( type == 'phenotype' ) {
      return;
    }

    defaultSizeMap[ type ] = getDefaultProcessSize();
  } );

  elementUtilities.logicalOperatorTypes.forEach( function( type ) {
    defaultSizeMap[ type ] = getDefaultLogicalOperatorSize();
  } );

  elementUtilities.biologicalActivityTypes.forEach( function( type ) {
    defaultSizeMap[ type ] = getDefaultBASize();
  } );

  var getDefaultSize = function( type ) {
    return defaultSizeMap[ type ];
  };

  var getDefaultFontProperties = function() {
    return {
      'font-size': 11,
      'font-family': 'Helvetica',
      'font-style': 'normal',
      'font-weight': 'normal',
      'color': '#000'
    };
  };

  var getDefaultInfoboxProperties = function() {
    return {
      'font-size': 9,
      'font-family': 'Arial',
      'font-style': 'normal',
      'font-weight': 'normal',
      'color': '#0f0f0f',
      'border-width': 2.25,
      'border-color': '#555',
      'background-color': '#ffffff'
    };
  };

  elementUtilities.nodeTypes.forEach( function( type ) {
    defaultProperties[ type ] = $.extend( {}, getDefaultNodeProperties(), getDefaultSize( type ) );
    if (elementUtilities.canHaveStateVariable( ele )) {
      defaultProperties[ type ][ 'state variable' ] = getDefaultInfoboxProperties();
    }
    if (elementUtilities.canHaveUnitOfInformation( ele )) {
      defaultProperties[ type ][ 'unit of information' ] = getDefaultInfoboxProperties();
    }
  } );

  elementUtilities.compoundNodeTypes.forEach( function( type ) {
    defaultProperties[ type ] = $.extend( defaultProperties[ type ], {
      'background-opacity': 0.5
    } );
  } );

  $.extend( defaultProperties['association'], {
    'background-color': '#707070'
  } );

  elementUtilities.epnTypes
    .concat( elementUtilities.sifTypes )
    .concat( elementUtilities.otherNodeTypes )
    .concat( ['phenotype'] )
    .forEach( function( type ) {
       $.extend( defaultProperties[ type ], getDefaultFontProperties() );
    } );

  $.extend( defaultProperties['submap'], {
    'font-size': 14,
    'border-width': 2.25
  } );

  $.extend( defaultProperties['compartment'], {
    'font-size': 14,
    'border-width': 3.25
  } );

  elementUtilities.edgeTypes.forEach( function( type ) {
    defaultProperties[ type ] = getDefaultEdgeProperties();
  } );

  elementUtilities.getDefaultProperties = function( sbgnclass ) {
    if ( sbgnclass == undefined ) {
      return defaultProperties;
    }

    var pureClass = elementUtilities.getPureSbgnClass( sbgnclass );

    // init default properties for the class if not initialized yet
    if ( defaultProperties[ pureClass ] == null ) {
      defaultProperties[ pureClass ] = {};
    }

    return defaultProperties[ pureClass ];
  };

  elementUtilities.setDefaultProperties = function( sbgnclass, props ) {
    $.extend( elementUtilities.getDefaultProperties( sbgnclass ), props );
  };

  return elementUtilities;
}
