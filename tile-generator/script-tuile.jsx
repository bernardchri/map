// Découpe l'image active en tuiles de 1024x1024 px
var TILE_SIZE = 1024;

var doc = app.activeDocument;
var cols = Math.ceil(doc.width / TILE_SIZE);
var rows = Math.ceil(doc.height / TILE_SIZE);

var outputFolder = Folder.selectDialog("Choisir le dossier de sortie");

for (var y = 0; y < rows; y++) {
  for (var x = 0; x < cols; x++) {
    var bounds = [
      x * TILE_SIZE,
      y * TILE_SIZE,
      Math.min((x + 1) * TILE_SIZE, doc.width),
      Math.min((y + 1) * TILE_SIZE, doc.height)
    ];
    
    doc.selection.select([
      [bounds[0], bounds[1]],
      [bounds[2], bounds[1]],
      [bounds[2], bounds[3]],
      [bounds[0], bounds[3]]
    ]);
    doc.selection.copy();

    var tileDoc = app.documents.add(bounds[2] - bounds[0], bounds[3] - bounds[1], doc.resolution, "tile", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
    tileDoc.paste();

    var saveFile = new File(outputFolder + "/" + y + "_" + x + ".png");
    var opts = new PNGSaveOptions();
    tileDoc.saveAs(saveFile, opts, true);
    tileDoc.close(SaveOptions.DONOTSAVECHANGES);
  }
}

alert("Tuiles exportées !");