import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { getAuthUser } from "../../lib/auth";

export async function GET(request) {
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
    // MONGODB
    // ==========================================

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "careerai"
    );

    const roadmapsCollection =
      db.collection("roadmaps");

    // ==========================================
    // GET ROADMAPS FOR USER
    // ==========================================

    const roadmaps =
      await roadmapsCollection
        .find({
          userId,
        })
        .sort({
          updatedAt: -1,
        })
        .toArray();

    // ==========================================
    // CLEAN MONGODB DATA
    // ==========================================

    const mapData = roadmaps.map(
      (roadmap) => ({
        id:
          roadmap.id ||
          roadmap.roadmapId ||
          "",

        roadmapId:
          roadmap.roadmapId ||
          roadmap.id ||
          "",

        topic:
          roadmap.topic || "",

        targetCareer:
          roadmap.targetCareer || "",

        targetCareerId:
          roadmap.targetCareerId || "",

        completed:
          roadmap.completed === true,

        stages:
          Array.isArray(roadmap.stages)
            ? roadmap.stages.map(
                (stage, stageIndex) => ({
                  id:
                    stage.id ??
                    stageIndex + 1,

                  title:
                    stage.title || "",

                  completed:
                    stage.completed === true,

                  topics:
                    Array.isArray(
                      stage.topics
                    )
                      ? stage.topics.map(
                          (topic) => ({
                            name:
                              topic.name ||
                              "",

                            completed:
                              topic.completed ===
                              true,
                          })
                        )
                      : [],
                })
              )
            : [],

        createdAt:
          roadmap.createdAt || null,

        updatedAt:
          roadmap.updatedAt || null,
      })
    );

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        userId,

        count: mapData.length,

        mapData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "MAP DATA GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong while fetching map data.",
      },
      {
        status: 500,
      }
    );
  }
}

