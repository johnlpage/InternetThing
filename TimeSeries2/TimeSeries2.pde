import org.gicentre.handy.*;
import java.util.Map;
import java.util.Date;
import java.util.Arrays;
import java.util.Collections;
import org.bson.types.ObjectId;
import java.text.SimpleDateFormat;

HandyRenderer h;

int docs[] = {};
int cursor[] = {};
String docId[] = {};
String bucketsts[] = {};
color palette[] = new color[255];
int drawmode = 1;
int targetDoc=-1;
int buckets[] = { -1, -1, -1, -1, -1, -1};

/* Lots of config*/

int nResults=8;
int nDevices = 6;
int last;
int  fcount = 0;
int newReadingValue=-1;
int newReadingX=0;
int newReadingY=0;
int targetX=0;
int targetY=0;
int docsPerBlock[] = {4, 3};
int nDocsPerBlock = docsPerBlock[0]*docsPerBlock[1];

int blocksTop = 50;
int blocksSpacing = 110;
int blockWidth = 300;
int blockHeight = 70;
int blocksLeft = 500;
int docHorSpacing = blockWidth / docsPerBlock[0];
int docVerSpacing = blockHeight / docsPerBlock[1];
int  docHeight = docVerSpacing * 8 / 10;
int docWidth = docHorSpacing * 8 / 10;
int docHMargin = 5;
int docVMargin = 2;
int blockspeed = 15;
int targetBucket=-1;
int numplaced=0;

void setup()
{
  randomSeed(10);

  size(900, 900);
  h = new HandyRenderer(this);
  //h = HandyPresets.createWaterAndInk(this);

  h.setOverrideFillColour(true);
  h.setOverrideStrokeColour(true);


  palette[0] = (color(255, 0, 0));
  palette[1] = (color(128, 128, 0));
  palette[2] = (color(0, 128, 0));
  palette[3] = (color(0, 255, 255));
  palette[4] = (color(0, 0, 128));
  palette[5] = (color(255, 0, 255));
  palette[6] = (color(255, 255, 255));
  palette[7] = (color(128, 0, 0));
  palette[8] = (color(128, 255, 0));
  
  last = millis();

  PFont wbfont;
  wbfont = createFont("ProgandaeEducation", 18);
  textFont(wbfont, 18);

  docs = new int[72];
  for (int x=0; x<72; x++) {
    docs[x]=-1;
  }
}

void drawDataBlocks()
{
  float nDocs = docs.length;
  int nBlocks = ceil(nDocs / nDocsPerBlock);

  h.setBackgroundColour(color(255,255, 255));
  h.setFillColour(color(255, 255, 255));
  h.setStrokeColour(color(0, 255, 0));

  for (int b=0; b<nBlocks; b++ ) {
    if (buckets[b]>=0) {
      h.setStrokeColour(color(100, 100, 100));
      h.rect(blocksLeft-10, blocksTop+b*blocksSpacing-10, blockWidth+20, blockHeight+20);
      h.setStrokeColour(palette[buckets[b]]);
      h.rect(blocksLeft, blocksTop+b*blocksSpacing, blockWidth, blockHeight);
    }
  }


  int rcount =0;
  for (int d=0; d<nDocs; d++) {
    int ddx = d % docsPerBlock[0]; //X offset
    int ddy = ( ( d % nDocsPerBlock) / docsPerBlock[0]);  //Y offset in block

    int dBlock = d / nDocsPerBlock;

    int xpos = blocksLeft + docHMargin + ddx*docHorSpacing;
    int ypos = dBlock * blocksSpacing + blocksTop + docVMargin + ddy*docVerSpacing;
    //Draw or tell us where to fly to

    if (docs[d] != -1) {
      /* Draw the block that have been placed*/
      h.setBackgroundColour(color(255,255,255));
      color dco = palette[docs[d]];

      h.setStrokeColour(dco);
      h.setFillColour(dco);
      //TODO - draw nicer?

      //if Drawmode == 2 then we want the first N highlighted
      if (drawmode == 2 ) {
        if ( buckets[dBlock] != 0) {
          h.setStrokeColour(color(200, 200, 200));
          h.setFillColour(color(200, 200, 200));
        }
      }
      h.rect(xpos, ypos, docWidth, docHeight);
    } else {
      // Is this the right block for the current new one?
      if (dBlock == targetBucket && targetDoc==-1) {
        targetX = xpos;
        targetY=ypos;
        targetDoc = d;
      }
    }
  }
  if (targetDoc == -1 && newReadingValue != -1) {
    //We failed to find a space , we need to add a bucket!
    for (int a=0; a<nDocsPerBlock; a++) {
      docs = append(docs, -1); //Ugh
    }
    //Now update out bucket list and also target bucket to this
    buckets = append(buckets, newReadingValue);
    /*Each bucket is a document*/
    docId = append(docId, new ObjectId().toString());
    bucketsts = append(bucketsts, String.format("{ deviceId: %d, from: %s, to: ... }", newReadingValue, renderDate(new java.util.Date())));
    targetBucket = buckets.length - 1;
  }
}

//Make it short
String renderDate(Date d)
{
SimpleDateFormat sdfDestination = new SimpleDateFormat(
                    "dd/MM/yyyy hh:mm:ss");
return sdfDestination.format(d);
}


void drawNewReading()
{
  boolean arrived = true;

  if (newReadingValue == -1) {
    newReadingValue = int(random(nDevices));
    newReadingX=100;
    newReadingY=0;
    //Work out where it's going
    //If we have a bucket for this value use if if not assign one
    int bi=0;
    int bucketno=0;
    targetBucket=-1;

    while (bucketno < buckets.length && buckets[bucketno] >= 0) {
      if (buckets[bucketno]==newReadingValue) {
        targetBucket = bucketno;
      }
      bucketno++;
    }
    /*Add a bucket*/
    if (targetBucket == -1) {
      targetBucket=bucketno;
      buckets[bucketno]=newReadingValue;
      /*Each bucket is a document*/
      docId = append(docId, new ObjectId().toString());
      bucketsts = append(bucketsts, String.format("{ deviceId: %d, from: %s, to: ... }", newReadingValue, renderDate(new java.util.Date())));
    }

    targetDoc=-1;
    arrived = false;
  }

  if (newReadingX < targetX) {
    newReadingX += blockspeed*3;
    arrived=false;
  } else {
    if (newReadingY < targetY) {
      newReadingY += blockspeed*3;
      arrived=false;
    }
  }

  h.setBackgroundColour(color(0, 0));
  color dco = palette[newReadingValue];
  h.setStrokeColour(dco);
  h.setFillColour(dco);
  h.rect(newReadingX, newReadingY, docWidth, docHeight);

  if (arrived) {
    docs[targetDoc]=newReadingValue;
    targetDoc=-1;
    newReadingValue=-1;
    numplaced++;
  }
}

String drawIndexes()
{
  h.setSeed(1234);
  h.setBackgroundColour(color(255,255,255));
  h.setFillColour(color(255,255,255));
  h.setStrokeColour(color(100,100,100));

  h.rect(20, blocksTop, 420, 300);
  fill(100,100,100);
  textSize(24);

  /* One per bucket this time */
  text("Index - { _id : 1 }", 25, blocksTop-20);
  textSize(18);

  String s="";
  for (int i=0; i<docId.length && i<13; i++) {

    s = "{_id: "+docId[i]+"} -> "+(i+1)+"\n";
    text(s, 25, blocksTop+30+(i*20));
  }
 


  h.rect(20, blocksTop+380, 420, 450);
  fill(100,100,100);
  textSize(24);
  text("Index - { deviceId : 1 , from: 1, to:1}", 25, blocksTop+345);
  textSize(18);
  /* Create an inversion*/
  ArrayList<String> tsidx = new ArrayList<String>();


  for (int i=0; i<bucketsts.length; i++) {

    String line = String.format("%s -> %d", bucketsts[i], i+1);
    tsidx.add(line);
  }

  Collections.sort(tsidx);

  /* Draw them in color and grab the date value of the highest 0 before line 6)*/

  String maxtsforzzero = "";
  for (int i=0; i<tsidx.size() && i<13; i++) {
    s = tsidx.get(i);
    String[] bits = match(s, "\\{ deviceId: (\\d*), from: (.*), to:.*\\}");
    println(s);
    int sensorid = Integer.parseInt(bits[1]);
    if (drawmode == 1 || sensorid == 0) {
      fill(palette[sensorid]);
    } else {
      fill(127, 127, 127);
    }
    text(tsidx.get(i), 25, blocksTop+420+(i*20));
    if (i<=nResults && sensorid == 0) {
      maxtsforzzero = bits[2];
    }
  }
  return maxtsforzzero;
}

void drawDocPerWrite()
{
  drawDataBlocks();
  drawNewReading();
  if ( numplaced >72) {
    drawmode=2;
  }
  drawIndexes();
}

void drawQuery(String dt)
{
  textSize(24);
  fill(100,100,100);
  text(String.format("Query: { deviceId : 0 , from: { $lte : ISODate('%s') }, to: ...", dt), 45, 770);
}


void drawDocPerRead()
{

  drawDataBlocks(); /*Including highlighting results*/
  String query = drawIndexes();
  // String query = drawIndexHighlights();
  // drawQuery(query);
}


void draw()
{
  h.setSeed(1234);
  background(255,255,255);
  if (drawmode == 1) {
    drawDocPerWrite();
  }
  if (drawmode == 2) {
    drawDocPerRead();
  }


  save(String.format("frames/diagram%06d.tif",fcount));
  fcount++;
}
