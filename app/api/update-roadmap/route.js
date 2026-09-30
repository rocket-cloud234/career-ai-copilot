import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { getAuthUser } from "../../lib/auth";

export async function PUT(request) {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please log in.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // GET USER ID
    // ==========================================

    const userId = String(
      authUser.userId || ""
    ).trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authenticated user.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // GET REQUEST BODY
    // ==========================================

    const body = await request.json();

    const roadmapId = String(
      body.roadmapId || ""
    ).trim();

    const parentStage = String(
      body.parentStage || ""
    ).trim();

    const topicName = String(
      body.topic || ""
    ).trim();

    // ==========================================
    // CHECKED VALUE
    // ==========================================

    if (
      typeof body.checked !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "checked is required and must be a boolean.",
        },
        {
          status: 400,
        }
      );
    }

    const checked = body.checked;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!roadmapId) {
      return NextResponse.json(
        {
          success: false,
          error: "roadmapId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!parentStage) {
      return NextResponse.json(
        {
          success: false,
          error: "parentStage is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!topicName) {
      return NextResponse.json(
        {
          success: false,
          error: "topic is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // MONGODB
    // ==========================================

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "careerai"
    );

    const roadmapsCollection =
      db.collection("roadmaps");

    // ==========================================
    // FIND ROADMAP
    // ==========================================

    const roadmap =
      await roadmapsCollection.findOne({
        userId,

        $or: [
          {
            roadmapId,
          },
          {
            id: roadmapId,
          },
        ],
      });

    if (!roadmap) {
      return NextResponse.json(
        {
          success: false,
          error: "Roadmap not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // FIND PARENT STAGE
    // ==========================================

    const stageIndex =
      Array.isArray(roadmap.stages)
        ? roadmap.stages.findIndex(
            (stage) =>
              String(
                stage.title || ""
              ).trim() === parentStage
          )
        : -1;

    if (stageIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: `Parent stage "${parentStage}" not found.`,
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // FIND TOPIC
    // ==========================================

    const topicIndex =
      Array.isArray(
        roadmap.stages[stageIndex].topics
      )
        ? roadmap.stages[
            stageIndex
          ].topics.findIndex(
            (topic) =>
              String(
                topic.name || ""
              ).trim() === topicName
          )
        : -1;

    if (topicIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: `Topic "${topicName}" not found in stage "${parentStage}".`,
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // UPDATE TOPIC
    // ==========================================

    const updatePath =
      `stages.${stageIndex}.topics.${topicIndex}.completed`;

    await roadmapsCollection.updateOne(
      {
        _id: roadmap._id,
        userId,
      },
      {
        $set: {
          [updatePath]: checked,
          updatedAt: new Date(),
        },
      }
    );

    // ==========================================
    // GET UPDATED ROADMAP
    // ==========================================

    const updatedRoadmap =
      await roadmapsCollection.findOne({
        _id: roadmap._id,
        userId,
      });

    if (!updatedRoadmap) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Roadmap was updated but could not be retrieved.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // GET UPDATED STAGE
    // ==========================================

    const updatedStage =
      updatedRoadmap.stages[stageIndex];

    // ==========================================
    // CHECK IF ALL TOPICS ARE COMPLETED
    // ==========================================

    const allTopicsCompleted =
      Array.isArray(
        updatedStage.topics
      ) &&
      updatedStage.topics.length > 0 &&
      updatedStage.topics.every(
        (topic) =>
          topic.completed === true
      );

    // ==========================================
    // UPDATE PARENT STAGE
    // ==========================================

    await roadmapsCollection.updateOne(
      {
        _id: roadmap._id,
        userId,
      },
      {
        $set: {
          [`stages.${stageIndex}.completed`]:
            allTopicsCompleted,

          updatedAt: new Date(),
        },
      }
    );

    updatedRoadmap.stages[
      stageIndex
    ].completed = allTopicsCompleted;

    // ==========================================
    // CHECK ALL STAGES
    // ==========================================

    const allStagesCompleted =
      Array.isArray(
        updatedRoadmap.stages
      ) &&
      updatedRoadmap.stages.length > 0 &&
      updatedRoadmap.stages.every(
        (stage) =>
          stage.completed === true
      );

    // ==========================================
    // UPDATE ROADMAP COMPLETION
    // ==========================================

    await roadmapsCollection.updateOne(
      {
        _id: roadmap._id,
        userId,
      },
      {
        $set: {
          completed:
            allStagesCompleted,

          updatedAt: new Date(),
        },
      }
    );

    updatedRoadmap.completed =
      allStagesCompleted;

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        message:
          checked
            ? "Topic marked as completed."
            : "Topic marked as incomplete.",

        roadmapId,

        parentStage:
          updatedStage.title,

        topic:
          updatedStage.topics[
            topicIndex
          ].name,

        checked,

        topicCompleted:
          updatedStage.topics[
            topicIndex
          ].completed,

        stageCompleted:
          updatedStage.completed,

        roadmapCompleted:
          updatedRoadmap.completed,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "TOPIC COMPLETION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : "Something went wrong while updating topic.",
      },
      {
        status: 500,
      }
    );
  }
}

